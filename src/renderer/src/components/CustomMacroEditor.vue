<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { Keyboard, Plus, Trash2, Minimize } from 'lucide-vue-next';
import BaseButton from './BaseButton.vue';
import BaseSelect from './BaseSelect.vue';
import BaseInput from './BaseInput.vue';
import Card from './Card.vue';
import StatusMessage from './StatusMessage.vue';
import { KeyCode } from '../../../shared/macro-templates.js';
import { MacroMode } from '../../../shared/macro-types.js';

enum Button {
	LEFT = 0,
	RIGHT = 1,
	MIDDLE = 2,
	FORWARD = 3,
	BACKWARD = 4,
}

const props = defineProps<{
	isConnected: boolean;
}>();

const emit = defineEmits<{
	customMacroApplied: [];
}>();

const { t } = useI18n();

const statusMessage = ref('');
const isSaving = ref(false);
const statusType = computed(() => (statusMessage.value.includes(t('macros.errorPrefix')) ? 'error' : 'success'));

const buttons = computed(() => [
	{ label: t('macros.buttons.left'), value: Button.LEFT },
	{ label: t('macros.buttons.right'), value: Button.RIGHT },
	{ label: t('macros.buttons.middle'), value: Button.MIDDLE },
	{ label: t('macros.buttons.forward'), value: Button.FORWARD },
	{ label: t('macros.buttons.backward'), value: Button.BACKWARD },
]);

const selectedButton = ref<Button>(Button.FORWARD);

const playbackModes = [
	{ label: t('macros.playbackModes.repeat'), value: MacroMode.THE_NUMBER_OF_TIME_TO_PLAY },
	{ label: t('macros.playbackModes.untilKey'), value: MacroMode.ANY_KEY_PRESS_TO_STOP_PLAYING },
	{ label: t('macros.playbackModes.whileHeld'), value: MacroMode.PRESS_AND_HOLD_RELEASE_STOP },
];

const selectedPlaybackMode = ref<MacroMode>(MacroMode.THE_NUMBER_OF_TIME_TO_PLAY);
const repeatCount = ref(1);

interface MacroEvent {
	type: 'key' | 'mouse';
	keyCode: number;
	delayMs: number;
	isRelease: boolean;
}

const events = ref<MacroEvent[]>([]);

const keyOptions = computed(() => {
	const keys = Object.entries(KeyCode)
		.filter(([, v]) => typeof v === 'number' && v !== KeyCode.NONE && v !== KeyCode.ONLY_USED_BY_EASY_AIM)
		.map(([k, v]) => ({ label: k, value: v as number }));
	return keys;
});

const mouseEventOptions = [
	{ label: 'Left Click', value: 0xf1 },
	{ label: 'Right Click', value: 0xf2 },
	{ label: 'Middle Click', value: 0xf3 },
	{ label: 'Backward Click', value: 0xf4 },
	{ label: 'Forward Click', value: 0xf5 },
];

const newEventType = ref<'key' | 'mouse'>('key');
const newEventKeyCode = ref(keyOptions.value[0]?.value ?? KeyCode.A);
const newEventDelay = ref(10);
const newEventIsRelease = ref(false);

const addEvent = () => {
	events.value.push({
		type: newEventType.value,
		keyCode: newEventKeyCode.value,
		delayMs: newEventDelay.value,
		isRelease: newEventIsRelease.value,
	});
	newEventDelay.value = 10;
	newEventIsRelease.value = false;
};

const removeEvent = (index: number) => {
	events.value.splice(index, 1);
};

const applyCustomMacro = async () => {
	if (!props.isConnected) return;
	if (events.value.length === 0) {
		statusMessage.value = `${t('macros.errorPrefix')}No events added`;
		return;
	}

	isSaving.value = true;
	statusMessage.value = t('macros.applying');

	try {
		// Send raw data to main process
		await window.api.sendCustomMacro({
			targetButton: selectedButton.value,
			playOptions: {
				mode: selectedPlaybackMode.value,
				times:
					selectedPlaybackMode.value === MacroMode.THE_NUMBER_OF_TIME_TO_PLAY ? repeatCount.value : undefined,
			},
			events: toRaw(events.value),
		});

		statusMessage.value = t('macros.customMacroApplied');
		setTimeout(() => (statusMessage.value = ''), 3000);
		emit('customMacroApplied');
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		statusMessage.value = `${t('macros.errorPrefix')}${error.message}`;
	} finally {
		isSaving.value = false;
	}
};

// Removed debounced watcher

const getEventLabel = (event: MacroEvent): string => {
	if (event.type === 'key') {
		const keyEntry = Object.entries(KeyCode).find(([, v]) => v === event.keyCode);
		return keyEntry ? `Key: ${keyEntry[0]}` : `Key: 0x${event.keyCode.toString(16).toUpperCase()}`;
	}
	const mouseEntry = mouseEventOptions.find((o) => o.value === event.keyCode);
	return mouseEntry ? `Mouse: ${mouseEntry.label}` : `Mouse: 0x${event.keyCode.toString(16).toUpperCase()}`;
};

const getEventDelayLabel = (event: MacroEvent): string => {
	return `${event.delayMs}ms ${event.isRelease ? '(Release)' : ''}`;
};
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h3 class="text-2xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
				<Keyboard class="w-7 h-7 text-shark-primary" />
				{{ $t('macros.customMacroTitle') }}
			</h3>
		</div>

		<p class="text-[var(--text-tertiary)] text-sm">{{ $t('macros.customMacroDesc') }}</p>

		<StatusMessage :message="statusMessage" :type="statusType" />

		<Card>
			<template #title>
				<Keyboard class="w-5 h-5 text-shark-primary" />
				{{ $t('macros.targetButton') }}
			</template>
			<BaseSelect v-model="selectedButton">
				<option v-for="btn in buttons" :key="btn.value" :value="btn.value">{{ btn.label }}</option>
			</BaseSelect>
		</Card>

		<Card>
			<template #title>
				<Minimize class="w-5 h-5 text-shark-primary" />
				{{ $t('macros.playbackMode') }}
			</template>
			<div class="space-y-4">
				<BaseSelect v-model="selectedPlaybackMode">
					<option v-for="mode in playbackModes" :key="mode.value" :value="mode.value">
						{{ mode.label }}
					</option>
				</BaseSelect>
				<div
					v-if="selectedPlaybackMode === MacroMode.THE_NUMBER_OF_TIME_TO_PLAY"
					class="flex items-center gap-4"
				>
					<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2 w-1/3">
						{{ $t('macros.repeatCount') }}
					</label>
					<BaseInput type="number" v-model.number="repeatCount" min="1" max="255" class="w-1/3" />
				</div>
			</div>
		</Card>

		<Card>
			<template #title>
				<div class="flex items-center justify-between">
					<Plus class="w-5 h-5 text-shark-primary" /> {{ $t('macros.events') }}
					<button
						@click="addEvent"
						class="bg-shark-primary hover:bg-shark-primary/80 text-white px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1"
					>
						<Plus class="w-4 h-4" /> {{ $t('macros.addEvent') }}
					</button>
				</div>
			</template>

			<div class="space-y-4">
				<div class="grid grid-cols-12 gap-4 mb-4">
					<div class="col-span-3">
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-1">{{
							$t('macros.eventType')
						}}</label>
						<BaseSelect v-model="newEventType">
							<option value="key">{{ $t('macros.key') }}</option>
							<option value="mouse">{{ $t('macros.mouseButton') }}</option>
						</BaseSelect>
					</div>
					<div class="col-span-4">
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-1">{{
							newEventType === 'key' ? $t('macros.key') : $t('macros.mouseButton')
						}}</label>
						<BaseSelect v-model="newEventKeyCode">
							<option
								v-for="opt in newEventType === 'key' ? keyOptions : mouseEventOptions"
								:key="opt.value"
								:value="opt.value"
							>
								{{ opt.label }}
							</option>
						</BaseSelect>
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-1">{{
							$t('macros.delay')
						}}</label>
						<BaseInput
							type="number"
							v-model.number="newEventDelay"
							min="0"
							max="60000"
							step="1"
							class="w-full"
						/>
					</div>
					<div class="col-span-2 flex items-end">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								v-model="newEventIsRelease"
								class="w-4 h-4 rounded border-[var(--border-card)] bg-[var(--bg-primary)] text-shark-primary focus:ring-shark-primary"
							/>
							<span class="text-sm text-[var(--text-primary)]">{{ $t('macros.release') }}</span>
						</label>
					</div>
				</div>

				<div v-if="events.length === 0" class="text-center py-8 text-[var(--text-tertiary)]">
					{{ $t('macros.noEvents') }}
				</div>

				<div v-else class="space-y-2 max-h-96 overflow-y-auto">
					<div
						v-for="(event, index) in events"
						:key="index"
						class="flex items-center gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-card)] rounded-lg"
					>
						<span
							class="w-8 h-8 flex items-center justify-center bg-[var(--border-card)] rounded text-sm font-medium text-[var(--text-primary)]"
							>{{ index + 1 }}</span
						>
						<div class="flex-1 min-w-0">
							<p class="font-medium text-[var(--text-primary)] truncate">{{ getEventLabel(event) }}</p>
							<p class="text-xs text-[var(--text-tertiary)]">{{ getEventDelayLabel(event) }}</p>
						</div>
						<button
							@click="removeEvent(index)"
							class="text-red-400 hover:text-red-300 p-1 transition-colors"
						>
							<Trash2 class="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		</Card>

		<div class="flex justify-end">
			<BaseButton
				@click="applyCustomMacro"
				:disabled="!isConnected || isSaving || events.length === 0"
				variant="green"
			>
				<Keyboard class="w-4 h-4 mr-2" />
				{{ isSaving ? $t('macros.applying') : $t('macros.applyCustomMacro') }}
			</BaseButton>
		</div>
	</div>
</template>
