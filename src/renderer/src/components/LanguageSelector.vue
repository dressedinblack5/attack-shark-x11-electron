<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseSelect from './BaseSelect.vue';

const { locale } = useI18n();
const currentLanguage = ref('en');

onMounted(async () => {
	const settings: any = await window.api.getSettings();
	if (settings && settings.language) {
		currentLanguage.value = settings.language;
		locale.value = settings.language;
	}
});

const updateLanguage = async (lang: string) => {
	currentLanguage.value = lang;
	locale.value = lang;
	const settings: any = await window.api.getSettings();
	await window.api.saveSettings({ ...settings, language: lang });
};
</script>

<template>
	<div class="flex items-center gap-2">
		<BaseSelect :modelValue="currentLanguage" @update:modelValue="updateLanguage" class="w-full">
			<option value="en">{{ $t('english') }}</option>
			<option value="es">{{ $t('spanish') }}</option>
		</BaseSelect>
	</div>
</template>
