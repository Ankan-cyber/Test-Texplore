import { useState, useEffect } from 'react';

/**
 * A hook that returns a debounced value after a specified delay.
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 * @example
 * ```tsx
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearch = useDebounce(searchInput, 500);
 * 
 * useEffect(() => {
 *   // This effect will only run 500ms after the last searchInput change
 *   fetchData(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce; 