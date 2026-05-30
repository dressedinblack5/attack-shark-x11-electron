<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { HardDrive, Info } from 'lucide-vue-next';
import BaseButton from './BaseButton.vue';

const props = defineProps<{
	isConnected: boolean;
}>();

interface DeviceInfoData {
	manufacturer: string;
	product: string;
	serialNumber: string;
	vendorId: string;
	productId: string;
	bcdDevice: string;
	connectionMode: string;
	interfaces: number;
}

const deviceInfo = ref<DeviceInfoData | null>(null);
const isLoading = ref(false);
const errorMessage = ref('');

const fetchDeviceInfo = async () => {
	if (!props.isConnected) return;
	isLoading.value = true;
	errorMessage.value = '';

	try {
		deviceInfo.value = await window.api.getDeviceInfo();
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		errorMessage.value = `Failed to fetch device info: ${error.message}`;
		console.error('Device info error:', error);
	} finally {
		isLoading.value = false;
	}
};

onMounted(() => {
	if (props.isConnected) {
		fetchDeviceInfo();
	}
});
</script>

<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
				<HardDrive class="w-8 h-8 text-shark-primary" />
				Device Information
			</h2>
			<BaseButton @click="fetchDeviceInfo" :disabled="!isConnected || isLoading" variant="blue">
				{{ isLoading ? 'Loading...' : 'Refresh' }}
			</BaseButton>
		</div>

		<!-- Error Message -->
		<div
			v-if="errorMessage"
			:class="['p-3 rounded-lg text-sm border', 'bg-red-500/10 border-red-500/20 text-red-400']"
		>
			{{ errorMessage }}
		</div>

		<!-- Device Info Display -->
		<div v-if="deviceInfo" class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Manufacturer & Product -->
			<div class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] space-y-4">
				<h3
					class="text-lg font-semibold border-b border-[var(--border-card)] pb-2 text-[var(--text-primary)] opacity-70 uppercase tracking-wider flex items-center gap-3 mb-6"
				>
					<HardDrive class="w-5 h-5 text-shark-primary" />
					Device
				</h3>
				<div class="space-y-4">
					<div>
						<p class="text-xs text-[var(--text-tertiary)] mb-1">Manufacturer</p>
						<p class="text-lg font-medium text-[var(--text-primary)]">{{ deviceInfo.manufacturer }}</p>
					</div>
					<div>
						<p class="text-xs text-[var(--text-tertiary)] mb-1">Product Name</p>
						<p class="text-lg font-medium text-[var(--text-primary)]">{{ deviceInfo.product }}</p>
					</div>
					<div>
						<p class="text-xs text-[var(--text-tertiary)] mb-1">Connection Mode</p>
						<p class="text-lg font-medium text-[var(--text-primary)]">{{ deviceInfo.connectionMode }}</p>
					</div>
				</div>
			</div>

			<!-- USB & Firmware Details -->
			<div class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] space-y-4">
				<h3
					class="text-lg font-semibold border-b border-[var(--border-card)] pb-2 text-[var(--text-primary)] opacity-70 uppercase tracking-wider flex items-center gap-3 mb-6"
				>
					Technical Details
				</h3>
				<div class="space-y-4">
					<div>
						<p class="text-xs text-[var(--text-tertiary)] mb-1">Vendor ID</p>
						<p class="text-lg font-medium text-[var(--text-primary)] font-mono">
							{{ deviceInfo.vendorId }}
						</p>
					</div>
					<div>
						<p class="text-xs text-[var(--text-tertiary)] mb-1">Product ID</p>
						<p class="text-lg font-medium text-[var(--text-primary)] font-mono">
							{{ deviceInfo.productId }}
						</p>
					</div>
					<div>
						<p class="text-xs text-[var(--text-tertiary)] mb-1">Device Version</p>
						<p class="text-lg font-medium text-[var(--text-primary)] font-mono">
							{{ deviceInfo.bcdDevice }}
						</p>
					</div>
					<div>
						<p class="text-xs text-[var(--text-tertiary)] mb-1">Interfaces</p>
						<p class="text-lg font-medium text-[var(--text-primary)]">{{ deviceInfo.interfaces }}</p>
					</div>
				</div>
			</div>

			<!-- Serial Number (spans both columns on larger screens) -->
			<div class="md:col-span-2 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)]">
				<div class="flex items-start gap-3">
					<Info class="w-5 h-5 text-shark-primary flex-shrink-0 mt-1" />
					<div class="flex-1">
						<p class="text-xs text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">Serial Number</p>
						<p class="text-lg font-medium text-[var(--text-primary)] font-mono break-all">
							{{ deviceInfo.serialNumber }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else-if="!isLoading" class="flex flex-col items-center justify-center py-12 text-center">
			<HardDrive class="w-12 h-12 text-[var(--text-tertiary)] mb-4 opacity-50" />
			<p class="text-[var(--text-tertiary)]">
				{{
					isConnected ? 'Click "Refresh" to load device information' : 'Connect a device to view information'
				}}
			</p>
		</div>

		<!-- Loading State -->
		<div v-else class="flex flex-col items-center justify-center py-12">
			<div
				class="w-8 h-8 border-2 border-shark-primary border-t-transparent rounded-full animate-spin mb-4"
			></div>
			<p class="text-[var(--text-tertiary)]">Loading device information...</p>
		</div>
	</div>
</template>

<style scoped>
@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.animate-spin {
	animation: spin 1s linear infinite;
}
</style>
