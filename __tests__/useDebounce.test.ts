import { describe, expect, it, vi, beforeEach, afterEach } from 'bun:test';
import { useDebounce } from '../src/renderer/src/composables/useDebounce';

describe('useDebounce', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should debounce the function call', () => {
		const fn = vi.fn();
		const debounced = useDebounce(fn, 300);

		debounced();
		debounced();
		debounced();

		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);

		expect(fn).toHaveBeenCalledTimes(1);
	});
});
