import { useDebounce } from './useDebounce';
import { useEffect, useState } from 'react';

type NpRefRecord = { Ref: string; Description: string };

const useNovaPoshta = () => {
	const [city, setCity] = useState('');
	const debouncedCity = useDebounce(city, 500);

	const [cities, setCities] = useState<NpRefRecord[]>([]);
	const [selectedCity, setSelectedCity] = useState('');

	const [warehouses, setWarehouses] = useState<NpRefRecord[]>([]);
	const [warehouseNumber, setWarehouseNumber] = useState('');
	const debouncedWarehouseNumber = useDebounce(warehouseNumber, 300);

	const [showDropdown, setShowDropdown] = useState(false);
	const [, setLoading] = useState(false);

	const fetchCities = async (cityName: string) => {
		if (!cityName.trim()) return;
		setLoading(true);

		try {
			const response = await fetch('/api/novaposhta/cities', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cityName }),
			});
			const data: unknown = await response.json();
			if (!response.ok || !Array.isArray(data)) {
				setCities([]);
				setShowDropdown(false);
				return;
			}
			setCities(data as NpRefRecord[]);
			setShowDropdown(true);
			setWarehouseNumber('');
		} catch {
			setCities([]);
			setShowDropdown(false);
		} finally {
			setLoading(false);
		}
	};

	const fetchWarehouses = async (cityRef: string, searchNumber = '') => {
		if (!cityRef) return;
		setLoading(true);
		setWarehouses([]);

		try {
			const response = await fetch('/api/novaposhta/warehouses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cityRef, searchNumber }),
			});
			const data: unknown = await response.json();
			if (!response.ok || !Array.isArray(data)) {
				setWarehouses([]);
				return;
			}
			setWarehouses(data as NpRefRecord[]);
		} catch {
			setWarehouses([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (debouncedCity) void fetchCities(debouncedCity);
	}, [debouncedCity]);

	useEffect(() => {
		if (selectedCity) void fetchWarehouses(selectedCity, debouncedWarehouseNumber);
	}, [selectedCity, debouncedWarehouseNumber]);

	return {
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
	};
};

export { useNovaPoshta };
