export function useDebounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
	let timer: ReturnType<typeof setTimeout>;
	const debounced = (...args: Parameters<T>): void => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
	debounced.cancel = (): void => clearTimeout(timer);
	return debounced;
}
