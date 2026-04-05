import { useEffect, useState } from 'react';

function useDebounce<T>(
	value: T,
	delay: number,
	callback?: (debouncedValue: T) => void,
): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
			callback?.(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay, callback]);

	return debouncedValue;
}

export { useDebounce };
