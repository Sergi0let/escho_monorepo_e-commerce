'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { deliveryData } from '@/data/delivery';
import { useNovaPoshta } from '@/hooks';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Info, Loader2, Pencil } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState, type FormEvent } from 'react';

type CheckoutSectionId = 'contact-info' | 'delivery-info' | 'payment-info';

const fieldClass =
	'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const fieldErrorRing = (touched: boolean, err?: string) =>
	touched && err ? 'border-destructive ring-1 ring-destructive/25' : '';

/** Аванс при оплаті після отримання (інформування клієнта). */
export const COD_ADVANCE_UAH = 100;

export type FormDataType = {
	lastname: string;
	name: string;
	phone: string;
	mail: string;
	deliveryType: string;
	deliveryAddress: string;
	deliveryCity?: string;
	paymentType: string;
	comment: string;
};

export const initialFormData: FormDataType = {
	lastname: '',
	name: '',
	phone: '',
	mail: '',
	deliveryType: '',
	deliveryAddress: '',
	deliveryCity: '',
	paymentType: '',
	comment: '',
};

type ValidationErrorsType = {
	[key in keyof FormDataType]?: string;
};

export type CheckoutFormProps = {
	onInputChange?: () => void;
	isSubmitting?: boolean;
	/** Викликається, коли контакти, доставка та оплата валідні (можна вмикати кнопку відправки). */
	onValidityChange?: (valid: boolean) => void;
	/** Відправка замовлення (наприклад після підтвердження у попапі). */
	onCheckoutSubmit?: (data: FormDataType) => void | Promise<void>;
	/** Після успішної валідації форми — показати підсумок замість миттєвої відправки. */
	onReviewRequested?: (data: FormDataType) => void;
};

const CheckoutForm = forwardRef<HTMLFormElement, CheckoutFormProps>(
	(
		{
			onInputChange,
			isSubmitting = false,
			onValidityChange,
			onCheckoutSubmit,
			onReviewRequested,
		},
		ref,
	) => {
	const [formData, setFormData] = useState<FormDataType>(initialFormData);
	const [validationErrors, setValidationErrors] =
		useState<ValidationErrorsType>({});
	const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
		{},
	);
	const [activeSection, setActiveSection] = useState<CheckoutSectionId>('contact-info');
	/** 1 = лише контакти; 2 = пройдено крок 1; 3 = пройдено крок 2 (можна фінальна відправка за умови валідності). */
	const [furthestStep, setFurthestStep] = useState<1 | 2 | 3>(1);

	const {
		city,
		setCity,
		selectedCity,
		setSelectedCity,
		warehouseNumber,
		setWarehouseNumber,
		cities,
		warehouses,
		showDropdown,
		setShowDropdown,
	} = useNovaPoshta();

	// New state variables and refs
	const [phoneValue, setPhoneValue] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const phoneInputRef = useRef<HTMLInputElement>(null);
	const PREFIX = '+38 (0';

	// Add these new functions for phone input handling
	// Format phone number to ensure it has the correct format with parentheses
	const formatPhoneNumber = (value: string): string => {
		// If empty, return empty string (for placeholder to show)
		if (!value || value === '') {
			return '';
		}

		// If just the prefix, return the prefix
		if (value === PREFIX) {
			return PREFIX;
		}

		// Extract all digits from the input
		const allDigits = value.replace(/[^0-9]/g, '');

		// Handle potential duplication of "380"
		let digits = allDigits;
		if (allDigits.startsWith('380')) {
			digits = allDigits.substring(3);
		}

		// Format the phone number with the new pattern
		if (digits.length <= 2) {
			// Just the operator code (partial)
			return `+38 (0${digits}`;
		} else if (digits.length <= 5) {
			// Operator code complete, starting area code
			return `+38 (0${digits.substring(0, 2)}) ${digits.substring(2)}`;
		} else if (digits.length <= 7) {
			// Area code complete, starting subscriber number
			return `+38 (0${digits.substring(0, 2)}) ${digits.substring(2, 5)} ${digits.substring(5)}`;
		} else {
			// Full number with proper spacing
			return `+38 (0${digits.substring(0, 2)}) ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;
		}
	};

	// Handle phone input changes
	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;

		// If we're deleting and at the prefix, don't format
		if (
			isDeleting &&
			(rawValue === PREFIX || rawValue.length <= PREFIX.length)
		) {
			setPhoneValue(PREFIX);
			updateFormData('phone', PREFIX);
			return;
		}

		const formattedValue = formatPhoneNumber(rawValue);
		setPhoneValue(formattedValue);
		updateFormData('phone', formattedValue);
	};

	// Handle key down events to detect deletion
	const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Track if we're deleting
		setIsDeleting(e.key === 'Backspace' || e.key === 'Delete');

		// If field is empty and user presses a digit, add the prefix
		if (/^\d$/.test(e.key) && (!phoneValue || phoneValue === '')) {
			setPhoneValue(PREFIX);
			setTimeout(() => {
				if (phoneInputRef.current) {
					phoneInputRef.current.value = PREFIX + e.key;
					const event = new Event('input', { bubbles: true });
					phoneInputRef.current.dispatchEvent(event);
				}
			}, 0);
		}

		// Prevent deleting the prefix when it's present
		if (
			(e.key === 'Backspace' || e.key === 'Delete') &&
			phoneValue.startsWith(PREFIX) &&
			phoneInputRef.current &&
			(phoneInputRef.current.selectionStart || 0) <= PREFIX.length
		) {
			e.preventDefault();
		}

		// Allow only digits, arrows, tab, backspace, delete
		const allowedKeys = [
			'Backspace',
			'Delete',
			'ArrowLeft',
			'ArrowRight',
			'Tab',
			'Home',
			'End',
		];
		if (
			!allowedKeys.includes(e.key) &&
			!/^\d$/.test(e.key) &&
			!e.ctrlKey &&
			!e.metaKey
		) {
			e.preventDefault();
		}
	};

	// Handle focus to ensure prefix and cursor position
	const handlePhoneFocus = () => {
		if (phoneInputRef.current) {
			// If empty, set to prefix
			if (!phoneValue || phoneValue === '') {
				setPhoneValue(PREFIX);
				updateFormData('phone', PREFIX);
			}

			// Position cursor after prefix if at the beginning
			const cursorPos = phoneInputRef.current.selectionStart || 0;
			if (cursorPos < PREFIX.length && phoneValue.startsWith(PREFIX)) {
				setTimeout(() => {
					phoneInputRef.current?.setSelectionRange(
						PREFIX.length,
						PREFIX.length,
					);
				}, 10);
			}
		}
	};

	// Handle blur event
	const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		// If only prefix is entered, clear the field to show placeholder
		if (phoneValue === PREFIX) {
			setPhoneValue('');
			updateFormData('phone', '');
		}

		// Validate the field
		handleBlur(e);
	};

	// Handle click to prevent cursor before prefix
	const handlePhoneClick = () => {
		if (phoneInputRef.current && phoneValue.startsWith(PREFIX)) {
			const cursorPos = phoneInputRef.current.selectionStart || 0;
			if (cursorPos < PREFIX.length) {
				phoneInputRef.current.setSelectionRange(PREFIX.length, PREFIX.length);
			}
		}
	};

	// Initialize phone value from formData
	useEffect(() => {
		if (formData.phone) {
			const formattedValue = formatPhoneNumber(formData.phone);
			setPhoneValue(formattedValue);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update formData
	const updateFormData = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Mark field as touched
		setTouchedFields((prev) => ({
			...prev,
			[field]: true,
		}));
	};

	// Handle form field changes
	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;

		if (name === 'deliveryType') {
			updateFormData('deliveryAddress', '');
			updateFormData('deliveryCity', '');
			setCity('');
			setSelectedCity('');
			setWarehouseNumber('');
		}

		updateFormData(name, value);

		if (name === 'paymentType') {
			setValidationErrors((prev) => ({ ...prev, paymentType: '' }));
		}
	};

	// Reset form on submission
	useEffect(() => {
		if (isSubmitting === true) {
			setFormData(initialFormData);
			setValidationErrors({});
			setTouchedFields({});
			setActiveSection('contact-info');
			setFurthestStep(1);
		}
	}, [isSubmitting]);

	// Validate form fields
	const validateField = (name: string, value: string): string => {
		switch (name) {
			case 'lastname':
			case 'name':
				return value.length < 3 ? 'Поле має містити щонайменше 3 символи' : '';
			case 'phone':
				// Check if the phone number has the correct format and length
				const digitsOnly = value.replace(/\D/g, '');
				if (digitsOnly.length < 10) {
					return 'Номер телефону має містити 10 цифр';
				}
				// Check if it starts with the correct prefix
				if (!value.startsWith('+38')) {
					return 'Номер телефону має починатися з +38';
				}
				return '';
			case 'mail': {
				const t = value.trim();
				if (!t) return '';
				return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
					? 'Некоректний email'
					: '';
			}
			case 'deliveryType':
				return !value ? 'Оберіть спосіб доставки' : '';
			case 'deliveryCity':
				return formData.deliveryType === 'Nova Poshta' && !value
					? 'Оберіть місто'
					: '';
			case 'deliveryAddress': {
				if (!formData.deliveryType) return '';
				if (formData.deliveryType === 'Інший варіант') {
					const t = value.trim();
					if (!t) return 'Опишіть бажаний спосіб доставки';
					if (t.length < 8)
						return 'Занадто короткий опис (мінімум 8 символів)';
					return '';
				}
				return !value ? 'Оберіть адресу доставки' : '';
			}
			default:
				return '';
		}
	};

	// Validate all fields in a section
	const validateSection = (section: string): boolean => {
		let isValid = true;
		const newErrors: ValidationErrorsType = {};

		if (section === 'contact-info') {
			['lastname', 'name', 'phone', 'mail'].forEach((field) => {
				const error = validateField(
					field,
					formData[field as keyof FormDataType] as string,
				);
				if (error) {
					newErrors[field as keyof FormDataType] = error;
					isValid = false;
				}
			});
		} else if (section === 'delivery-info') {
			['deliveryType'].forEach((field) => {
				const error = validateField(
					field,
					formData[field as keyof FormDataType] as string,
				);
				if (error) {
					newErrors[field as keyof FormDataType] = error;
					isValid = false;
				}
			});

			if (formData.deliveryType === 'Nova Poshta') {
				['deliveryCity', 'deliveryAddress'].forEach((field) => {
					const error = validateField(
						field,
						formData[field as keyof FormDataType] as string,
					);
					if (error) {
						newErrors[field as keyof FormDataType] = error;
						isValid = false;
					}
				});
			} else if (formData.deliveryType === 'Самовивіз') {
				const error = validateField(
					'deliveryAddress',
					formData.deliveryAddress,
				);
				if (error) {
					newErrors.deliveryAddress = error;
					isValid = false;
				}
			} else if (formData.deliveryType === 'Інший варіант') {
				const error = validateField(
					'deliveryAddress',
					formData.deliveryAddress,
				);
				if (error) {
					newErrors.deliveryAddress = error;
					isValid = false;
				}
			}
		} else if (section === 'payment-info') {
			if (!formData.paymentType) {
				newErrors.paymentType = 'Оберіть спосіб оплати';
				isValid = false;
			}
		}

		setValidationErrors((prev) => ({ ...prev, ...newErrors }));
		return isValid;
	};

	const isContactInfoValid = Boolean(
		formData.lastname &&
			formData.name &&
			formData.phone &&
			!validationErrors.lastname &&
			!validationErrors.name &&
			!validationErrors.phone &&
			!validationErrors.mail,
	);

	const isDeliveryInfoValid = (() => {
		if (!formData.deliveryType) return false;

		if (formData.deliveryType === 'Nova Poshta') {
			return Boolean(
				formData.deliveryCity &&
					formData.deliveryAddress &&
					!validationErrors.deliveryCity &&
					!validationErrors.deliveryAddress,
			);
		}

		if (formData.deliveryType === 'Самовивіз') {
			return Boolean(
				formData.deliveryAddress && !validationErrors.deliveryAddress,
			);
		}

		if (formData.deliveryType === 'Інший варіант') {
			const t = formData.deliveryAddress?.trim() ?? '';
			return Boolean(
				t.length >= 8 && !validationErrors.deliveryAddress,
			);
		}

		return false;
	})();

	const isPaymentInfoValid =
		!!formData.paymentType &&
		(formData.paymentType === 'payAfterGetting' ||
			formData.paymentType === 'payNoCash') &&
		!validationErrors.paymentType;

	// Handle field blur for validation
	const handleBlur = (
		e: React.FocusEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		const error = validateField(name, value);

		setValidationErrors((prev) => ({
			...prev,
			[name]: error,
		}));

		setTouchedFields((prev) => ({
			...prev,
			[name]: true,
		}));
	};

	const handleOpenSection = (
		currentId: CheckoutSectionId,
		nextId: CheckoutSectionId,
		e: React.MouseEvent<HTMLButtonElement>,
	) => {
		e.preventDefault();

		if (!validateSection(currentId)) {
			const sectionFields: Record<string, boolean> = {};

			if (currentId === 'contact-info') {
				['lastname', 'name', 'phone', 'mail'].forEach((field) => {
					sectionFields[field] = true;
				});
			} else if (currentId === 'delivery-info') {
				['deliveryType', 'deliveryCity', 'deliveryAddress'].forEach((field) => {
					sectionFields[field] = true;
				});
			}

			setTouchedFields((prev) => ({
				...prev,
				...sectionFields,
			}));

			return;
		}

		if (currentId === 'contact-info' && nextId === 'delivery-info') {
			setFurthestStep((prev) => (prev < 2 ? 2 : prev));
		} else if (currentId === 'delivery-info' && nextId === 'payment-info') {
			setFurthestStep(3);
		}
		setActiveSection(nextId);
	};

	const formatDeliveryInfoSummary = () => {
		if (formData.deliveryType === 'Самовивіз') {
			return `${formData.deliveryType} / ${formData.deliveryAddress}`;
		} else if (formData.deliveryType === 'Nova Poshta') {
			return `${formData.deliveryType} / ${formData.deliveryCity || ''} / ${formData.deliveryAddress}`;
		} else if (formData.deliveryType === 'Інший варіант') {
			return `${formData.deliveryType}: ${formData.deliveryAddress}`;
		}
		return '';
	};

	const formatPaymentSummary = () => {
		if (formData.paymentType === 'payAfterGetting') {
			return 'Оплата при отриманні товару';
		}
		if (formData.paymentType === 'payNoCash') {
			return 'Безготівковий розрахунок';
		}
		return '';
	};

	useEffect(() => {
		const valid = Boolean(
			furthestStep >= 3 &&
				isContactInfoValid &&
				isDeliveryInfoValid &&
				isPaymentInfoValid,
		);
		if (ref && typeof ref === 'object' && ref.current) {
			ref.current.setAttribute('data-valid', valid ? 'true' : 'false');
		}
		onInputChange?.();
		onValidityChange?.(valid);
	}, [
		furthestStep,
		isContactInfoValid,
		isDeliveryInfoValid,
		isPaymentInfoValid,
		onInputChange,
		onValidityChange,
		ref,
	]);

	const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const contactOk = validateSection('contact-info');
		if (!contactOk) {
			setActiveSection('contact-info');
			const sectionFields: Record<string, boolean> = {};
			['lastname', 'name', 'phone', 'mail'].forEach((field) => {
				sectionFields[field] = true;
			});
			setTouchedFields((prev) => ({ ...prev, ...sectionFields }));
			return;
		}
		const deliveryOk = validateSection('delivery-info');
		if (!deliveryOk) {
			setActiveSection('delivery-info');
			const sectionFields: Record<string, boolean> = {};
			['deliveryType', 'deliveryCity', 'deliveryAddress'].forEach((field) => {
				sectionFields[field] = true;
			});
			setTouchedFields((prev) => ({ ...prev, ...sectionFields }));
			return;
		}
		const paymentOk = validateSection('payment-info');
		if (!paymentOk) {
			setActiveSection('payment-info');
			setTouchedFields((prev) => ({ ...prev, paymentType: true }));
			return;
		}
		if (onReviewRequested) {
			onReviewRequested(formData);
			return;
		}
		if (onCheckoutSubmit) {
			await onCheckoutSubmit(formData);
		}
	};

	if (isSubmitting) {
		return (
			<div className='flex flex-col items-center justify-center py-20'>
				<Loader2 className='text-primary h-16 w-16 animate-spin' />
				<p className='text-foreground mt-4 text-lg font-medium'>
					Обробка замовлення...
				</p>
			</div>
		);
	}

	const stepBadge = (n: number, done: boolean, active: boolean) => (
		<span
			className={cn(
				'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-200',
				done && !active
					? 'border-primary bg-primary text-primary-foreground'
					: active
						? 'border-primary text-primary'
						: 'border-muted-foreground/25 text-muted-foreground',
			)}>
			{done && !active ? (
				<Check aria-hidden className='size-4' strokeWidth={2.5} />
			) : (
				n
			)}
		</span>
	);

	return (
		<form
			ref={ref}
			id='checkout-form'
			className='relative mt-2 space-y-4'
			onInput={onInputChange}
			onSubmit={handleFormSubmit}>
			<section
				className={cn(
					'overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200',
					activeSection === 'contact-info' && 'ring-2 ring-primary/20',
				)}
				aria-labelledby='checkout-step-contact-heading'>
				<div
					className={cn(
						'flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5',
						activeSection === 'contact-info' ? 'bg-muted/40' : 'bg-card',
					)}>
					<div className='flex min-w-0 flex-1 items-start gap-3'>
						{stepBadge(1, isContactInfoValid, activeSection === 'contact-info')}
						<div className='min-w-0'>
							<h2
								id='checkout-step-contact-heading'
								className='font-display text-base font-medium tracking-tight text-foreground sm:text-lg'>
								1. Контактна інформація
							</h2>
							{isContactInfoValid && activeSection !== 'contact-info' ? (
								<p className='text-muted-foreground mt-1 line-clamp-2 text-xs sm:text-sm'>
									{formData.lastname} / {formData.name} / {formData.phone}
									{formData.mail.trim()
										? ` / ${formData.mail}`
										: ' · email не вказано'}
								</p>
							) : null}
						</div>
					</div>
					{isContactInfoValid && activeSection !== 'contact-info' ? (
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='text-primary shrink-0 cursor-pointer gap-1.5'
							onClick={() => setActiveSection('contact-info')}>
							<Pencil className='size-3.5' aria-hidden />
							Редагувати
						</Button>
					) : null}
				</div>

				{activeSection === 'contact-info' ? (
					<div className='px-4 pb-5 pt-2 sm:px-5 sm:pt-4'>
						<div className='lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-1'>
							<div className='input-group mb-3 lg:mb-4'>
								<label
									htmlFor='lastname'
									className='mb-1.5 block text-sm font-medium text-foreground'>
									Прізвище <sup className='text-destructive'>*</sup>
								</label>
								<input
									type='text'
									name='lastname'
									id='lastname'
									placeholder='Ваше прізвище'
									required
									minLength={3}
									value={formData.lastname}
									onChange={handleChange}
									onBlur={handleBlur}
									autoComplete='family-name'
									className={cn(
										fieldClass,
										fieldErrorRing(
											!!touchedFields.lastname,
											validationErrors.lastname,
										),
									)}
								/>
								{touchedFields.lastname && validationErrors.lastname ? (
									<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
										<AlertCircle className='size-3 shrink-0' aria-hidden />
										{validationErrors.lastname}
									</div>
								) : null}
							</div>
							<div className='input-group mb-3 lg:mb-4'>
								<label
									htmlFor='name'
									className='mb-1.5 block text-sm font-medium text-foreground'>
									Ім&apos;я <sup className='text-destructive'>*</sup>
								</label>
								<input
									type='text'
									name='name'
									id='name'
									placeholder="Ваше ім'я"
									required
									minLength={3}
									value={formData.name}
									onChange={handleChange}
									onBlur={handleBlur}
									autoComplete='given-name'
									className={cn(
										fieldClass,
										fieldErrorRing(!!touchedFields.name, validationErrors.name),
									)}
								/>
								{touchedFields.name && validationErrors.name ? (
									<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
										<AlertCircle className='size-3 shrink-0' aria-hidden />
										{validationErrors.name}
									</div>
								) : null}
							</div>
							<div className='input-group mb-3 lg:mb-4'>
								<label
									htmlFor='phone'
									className='mb-1.5 block text-sm font-medium text-foreground'>
									Телефон <sup className='text-destructive'>*</sup>
								</label>
								<input
									type='tel'
									name='phone'
									id='phone'
									ref={phoneInputRef}
									inputMode='numeric'
									placeholder='+38 (0__) ___ __ __'
									required
									value={phoneValue}
									onChange={handlePhoneChange}
									onKeyDown={handlePhoneKeyDown}
									onFocus={handlePhoneFocus}
									onClick={handlePhoneClick}
									onBlur={handlePhoneBlur}
									autoComplete='tel'
									maxLength={19}
									className={cn(
										fieldClass,
										fieldErrorRing(!!touchedFields.phone, validationErrors.phone),
									)}
								/>
								{touchedFields.phone && validationErrors.phone ? (
									<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
										<AlertCircle className='size-3 shrink-0' aria-hidden />
										{validationErrors.phone}
									</div>
								) : null}
							</div>
							<div className='input-group mb-3 lg:mb-4'>
								<label
									htmlFor='mail'
									className='mb-1.5 block text-sm font-medium text-foreground'>
									E-mail{' '}
									<span className='text-muted-foreground font-normal'>
										(необов&apos;язково)
									</span>
								</label>
								<input
									type='email'
									name='mail'
									id='mail'
									placeholder='email@gmail.com'
									value={formData.mail}
									onChange={handleChange}
									onBlur={handleBlur}
									autoComplete='email'
									className={cn(
										fieldClass,
										fieldErrorRing(!!touchedFields.mail, validationErrors.mail),
									)}
								/>
								{touchedFields.mail && validationErrors.mail ? (
									<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
										<AlertCircle className='size-3 shrink-0' aria-hidden />
										{validationErrors.mail}
									</div>
								) : null}
							</div>
							<p className='text-muted-foreground mb-3 text-xs lg:col-span-2'>
								<sup className='text-destructive'>*</sup> — обов&apos;язкові поля
							</p>
							<div className='lg:col-span-2'>
								<Button
									type='button'
									size='lg'
									className='h-11 w-full max-w-sm cursor-pointer font-semibold tracking-wide sm:w-auto'
									onClick={(e) =>
										handleOpenSection('contact-info', 'delivery-info', e)
									}>
									Продовжити оформлення
								</Button>
							</div>
						</div>
					</div>
				) : null}
			</section>

			{/* Delivery Information Section */}
			<section
				className={cn(
					'overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200',
					!isContactInfoValid && 'opacity-60',
					activeSection === 'delivery-info' && 'ring-2 ring-primary/20',
				)}
				aria-labelledby='checkout-step-delivery-heading'>
				<div
					className={cn(
						'flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5',
						activeSection === 'delivery-info' ? 'bg-muted/40' : 'bg-card',
					)}>
					<div className='flex min-w-0 flex-1 items-start gap-3'>
						{stepBadge(
							2,
							isDeliveryInfoValid,
							activeSection === 'delivery-info',
						)}
						<div className='min-w-0'>
							<h2
								id='checkout-step-delivery-heading'
								className={cn(
									'font-display text-base font-medium tracking-tight sm:text-lg',
									isContactInfoValid
										? 'text-foreground'
										: 'text-muted-foreground',
								)}>
								2. Спосіб доставки
							</h2>
							{isDeliveryInfoValid &&
							activeSection !== 'delivery-info' &&
							isContactInfoValid ? (
								<p className='text-muted-foreground mt-1 line-clamp-2 text-xs sm:text-sm'>
									{formatDeliveryInfoSummary()}
								</p>
							) : null}
							{!isContactInfoValid ? (
								<p className='text-muted-foreground mt-1 text-xs'>
									Спочатку заповніть контактні дані
								</p>
							) : null}
						</div>
					</div>
					{isDeliveryInfoValid &&
					activeSection !== 'delivery-info' &&
					isContactInfoValid ? (
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='text-primary shrink-0 cursor-pointer gap-1.5'
							onClick={() => setActiveSection('delivery-info')}>
							<Pencil className='size-3.5' aria-hidden />
							Редагувати
						</Button>
					) : null}
				</div>

				{activeSection === 'delivery-info' && isContactInfoValid ? (
					<div className='px-4 pb-5 pt-2 sm:px-5 sm:pt-4'>
						<div className='accordion-content-body'>
							<div className='input-group mb-3'>
								<label
									htmlFor='deliveryType'
									className='mb-1.5 block text-sm font-medium text-foreground'>
									Спосіб доставки <sup className='text-destructive'>*</sup>
								</label>
								<select
									name='deliveryType'
									id='deliveryType'
									required
									value={formData.deliveryType}
									onChange={handleChange}
									onBlur={handleBlur}
									className={cn(
										fieldClass,
										fieldErrorRing(
											!!touchedFields.deliveryType,
											validationErrors.deliveryType,
										),
									)}>
									<option value=''>Оберіть спосіб доставки</option>
									{deliveryData.map(({ id, name }) => (
										<option key={id} value={name}>
											{name}
										</option>
									))}
								</select>
								{touchedFields.deliveryType &&
								validationErrors.deliveryType ? (
									<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
										<AlertCircle className='size-3 shrink-0' aria-hidden />
										{validationErrors.deliveryType}
									</div>
								) : null}
							</div>

							{formData.deliveryType === 'Nova Poshta' && (
								<div className='input-group relative mb-3'>
									<label
										htmlFor='deliveryCity'
										className='mb-1.5 block text-sm font-medium text-foreground'>
										Місто <sup className='text-destructive'>*</sup>
									</label>
									<input
										type='text'
										name='deliveryCity'
										value={city}
										onChange={(e) => {
											setCity(e.target.value);
											updateFormData('deliveryCity', e.target.value);
										}}
										onBlur={handleBlur}
										placeholder='Введіть місто'
										className={cn(
											'delivery-city',
											fieldClass,
											fieldErrorRing(
												!!touchedFields.deliveryCity,
												validationErrors.deliveryCity,
											),
										)}
										required
									/>
									{touchedFields.deliveryCity &&
									validationErrors.deliveryCity ? (
										<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
											<AlertCircle className='size-3 shrink-0' aria-hidden />
											{validationErrors.deliveryCity}
										</div>
									) : null}

									{showDropdown && cities.length > 0 && (
										<div className='border-border bg-card z-10 mt-1 max-h-40 w-full touch-auto overflow-y-auto rounded-lg border shadow-md'>
											{cities.map((city: { [key: string]: string }) => (
												<button
													key={city.Ref}
													type='button'
													className='hover:bg-muted block w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors duration-200'
													onClick={(e) => {
														e.preventDefault();
														setCity(city.Description);
														setSelectedCity(city.Ref);
														updateFormData('deliveryCity', city.Description);
														setShowDropdown(false);
														setValidationErrors((prev) => ({
															...prev,
															deliveryCity: '',
														}));
													}}>
													{city.Description}
												</button>
											))}
										</div>
									)}
								</div>
							)}

							{selectedCity && formData.deliveryType === 'Nova Poshta' && (
								<div className='input-group warhouse-select mb-3'>
									<label
										htmlFor='deliveryAddress'
										className='mb-1.5 block pr-16 text-sm font-medium text-foreground'>
										Відділення <sup className='text-destructive'>*</sup>
									</label>
									<input
										type='text'
										name='deliveryAddress'
										id='deliveryAddress'
										value={warehouseNumber}
										onChange={(e) => {
											setWarehouseNumber(e.target.value);
											updateFormData('deliveryAddress', e.target.value);
										}}
										onBlur={handleBlur}
										placeholder='Введіть номер відділення'
										className={cn(
											'delivery-address',
											fieldClass,
											fieldErrorRing(
												!!touchedFields.deliveryAddress,
												validationErrors.deliveryAddress,
											),
										)}
										required
									/>
									{touchedFields.deliveryAddress &&
									validationErrors.deliveryAddress ? (
										<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
											<AlertCircle className='size-3 shrink-0' aria-hidden />
											{validationErrors.deliveryAddress}
										</div>
									) : null}
								</div>
							)}

							{warehouses.length > 0 &&
								formData.deliveryType === 'Nova Poshta' && (
									<ul className='border-border bg-card mb-3 max-h-60 w-full overflow-y-auto rounded-lg border text-sm shadow-sm'>
										{warehouses.map((wh: { [key: string]: string }) => (
											<li
												key={wh.Ref}
												className='hover:bg-muted cursor-pointer border-b border-border px-3 py-2.5 transition-colors duration-200 last:border-b-0'
												onClick={() => {
													setWarehouseNumber(wh.Description);
													updateFormData('deliveryAddress', wh.Description);
													setValidationErrors((prev) => ({
														...prev,
														deliveryAddress: '',
													}));
												}}>
												{wh.Description}
											</li>
										))}
									</ul>
								)}

							{formData.deliveryType === 'Самовивіз' && (
								<div className='input-group mb-3'>
									<label
										htmlFor='deliveryAddress'
										className='mb-1.5 block text-sm font-medium text-foreground'>
										Адреса складу <sup className='text-destructive'>*</sup>
									</label>
									<select
										onChange={handleChange}
										onBlur={handleBlur}
										name='deliveryAddress'
										id='deliveryAddress'
										value={formData.deliveryAddress}
										className={cn(
											fieldClass,
											fieldErrorRing(
												!!touchedFields.deliveryAddress,
												validationErrors.deliveryAddress,
											),
										)}
										required>
										<option value=''>Оберіть адресу складу</option>
										<option value='Київ вул Новозабарська 21 (склад), Київ, Україна'>
											Київ вул. Новозабарська, 21 (склад), Київ, Україна
										</option>
									</select>
									{touchedFields.deliveryAddress &&
									validationErrors.deliveryAddress ? (
										<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
											<AlertCircle className='size-3 shrink-0' aria-hidden />
											{validationErrors.deliveryAddress}
										</div>
									) : null}
								</div>
							)}

							{formData.deliveryType === 'Інший варіант' && (
								<div className='input-group mb-3'>
									<label
										htmlFor='delivery-other-note'
										className='mb-1.5 block text-sm font-medium text-foreground'>
										Опишіть доставку <sup className='text-destructive'>*</sup>
									</label>
									<p className='text-muted-foreground mb-2 text-xs'>
										Якщо жоден зі стандартних варіантів не підходить — напишіть, як
										зручніше отримати замовлення (мінімум 8 символів).
									</p>
									<textarea
										name='deliveryAddress'
										id='delivery-other-note'
										rows={4}
										value={formData.deliveryAddress}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder='Наприклад: кур’єр по Києву, інша служба доставки, домовленість про час…'
										className={cn(
											fieldClass,
											'min-h-[100px] resize-y',
											fieldErrorRing(
												!!touchedFields.deliveryAddress,
												validationErrors.deliveryAddress,
											),
										)}
									/>
									{touchedFields.deliveryAddress &&
									validationErrors.deliveryAddress ? (
										<div className='text-destructive mt-1 flex items-center gap-1 text-xs'>
											<AlertCircle className='size-3 shrink-0' aria-hidden />
											{validationErrors.deliveryAddress}
										</div>
									) : null}
								</div>
							)}

							<p className='text-muted-foreground mb-3 text-xs'>
								<sup className='text-destructive'>*</sup> — обов&apos;язкові поля
							</p>
							<Button
								type='button'
								size='lg'
								className='h-11 w-full max-w-sm cursor-pointer font-semibold tracking-wide sm:w-auto'
								onClick={(e) =>
									handleOpenSection('delivery-info', 'payment-info', e)
								}>
								Продовжити оформлення
							</Button>
						</div>
					</div>
				) : null}
			</section>

			{/* Payment Information Section */}
			<section
				className={cn(
					'overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200',
					!isDeliveryInfoValid && 'opacity-60',
					activeSection === 'payment-info' && 'ring-2 ring-primary/20',
				)}
				aria-labelledby='checkout-step-payment-heading'>
				<div
					className={cn(
						'flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5',
						activeSection === 'payment-info' ? 'bg-muted/40' : 'bg-card',
					)}>
					<div className='flex min-w-0 flex-1 items-start gap-3'>
						{stepBadge(
							3,
							isPaymentInfoValid,
							activeSection === 'payment-info',
						)}
						<div className='min-w-0'>
							<h2
								id='checkout-step-payment-heading'
								className={cn(
									'font-display text-base font-medium tracking-tight sm:text-lg',
									isDeliveryInfoValid
										? 'text-foreground'
										: 'text-muted-foreground',
								)}>
								3. Спосіб оплати
							</h2>
							{isPaymentInfoValid &&
							activeSection !== 'payment-info' &&
							isDeliveryInfoValid ? (
								<p className='text-muted-foreground mt-1 text-xs sm:text-sm'>
									{formatPaymentSummary()}
								</p>
							) : null}
							{!isDeliveryInfoValid ? (
								<p className='text-muted-foreground mt-1 text-xs'>
									Спочатку оберіть доставку
								</p>
							) : null}
						</div>
					</div>
					{isPaymentInfoValid &&
					activeSection !== 'payment-info' &&
					isDeliveryInfoValid ? (
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='text-primary shrink-0 cursor-pointer gap-1.5'
							onClick={() => setActiveSection('payment-info')}>
							<Pencil className='size-3.5' aria-hidden />
							Редагувати
						</Button>
					) : null}
				</div>

				{activeSection === 'payment-info' && isDeliveryInfoValid ? (
					<div className='px-4 pb-5 pt-2 sm:px-5 sm:pt-4'>
						<div className='space-y-3'>
							<label
								className={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-200',
									formData.paymentType === 'payAfterGetting'
										? 'border-primary bg-muted/50'
										: 'border-border hover:bg-muted/30',
								)}>
								<input
									className='text-primary mt-0.5 size-4 shrink-0 cursor-pointer accent-primary'
									type='radio'
									id='payOne'
									name='paymentType'
									value='payAfterGetting'
									checked={formData.paymentType === 'payAfterGetting'}
									onChange={handleChange}
								/>
								<span className='text-sm font-medium text-foreground sm:text-base'>
									Оплата при отриманні товару
								</span>
							</label>

							<label
								className={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-200',
									formData.paymentType === 'payNoCash'
										? 'border-primary bg-muted/50'
										: 'border-border hover:bg-muted/30',
								)}>
								<input
									className='text-primary mt-0.5 size-4 shrink-0 cursor-pointer accent-primary'
									type='radio'
									id='payTwo'
									name='paymentType'
									value='payNoCash'
									checked={formData.paymentType === 'payNoCash'}
									onChange={handleChange}
								/>
								<span className='text-sm font-medium text-foreground sm:text-base'>
									Безготівковий розрахунок
								</span>
							</label>

							{formData.paymentType === 'payAfterGetting' ? (
								<div
									role='note'
									aria-live='polite'
									className='animate-in fade-in slide-in-from-bottom-2 border-primary/20 bg-primary/5 motion-reduce:animate-none mt-1 rounded-lg border p-4 duration-300'>
									<div className='flex gap-3'>
										<Info
											className='text-primary mt-0.5 size-5 shrink-0'
											aria-hidden
										/>
										<div className='min-w-0 space-y-2 text-sm'>
											<p className='text-foreground font-semibold'>
												Аванс {COD_ADVANCE_UAH} грн
											</p>
											<p className='text-foreground font-medium'>
												Чому потрібен аванс?
											</p>
											<p className='text-muted-foreground leading-relaxed'>
												Забираєте посилку — аванс віднімаємо від оплати на
												пошті. Не забрали — аванс йде на витрати доставки /
												повернення.
											</p>
										</div>
									</div>
								</div>
							) : null}

							{touchedFields.paymentType && validationErrors.paymentType ? (
								<div className='text-destructive flex items-center gap-1 text-xs'>
									<AlertCircle className='size-3 shrink-0' aria-hidden />
									{validationErrors.paymentType}
								</div>
							) : null}
						</div>
					</div>
				) : null}
			</section>

			{/* Comment Section */}
			<div className='input-group rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5'>
				<label
					htmlFor='comment-field'
					className='mb-1.5 block text-sm font-medium text-foreground'>
					Коментар до замовлення
				</label>
				<textarea
					name='comment'
					id='comment-field'
					value={formData.comment}
					onChange={handleChange}
					rows={4}
					placeholder='Додаткова інформація до замовлення'
					className={cn(fieldClass, 'min-h-[100px] resize-y')}
				/>
			</div>
		</form>
	);
});

CheckoutForm.displayName = 'CheckoutForm';
export { CheckoutForm };
