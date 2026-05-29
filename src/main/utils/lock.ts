export class AsyncLock {
	private locked = false;

	async acquire(): Promise<void> {
		while (this.locked) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
		this.locked = true;
	}

	release(): void {
		this.locked = false;
	}
}
