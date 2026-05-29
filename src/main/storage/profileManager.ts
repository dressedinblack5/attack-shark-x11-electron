import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = path.join(app.getPath('userData'), 'profiles.json');

export interface Profile {
	name: string;
	data: unknown;
}

export async function listProfiles(): Promise<string[]> {
	try {
		const data = await fs.readFile(STORAGE_PATH, 'utf-8');
		const profiles: Profile[] = JSON.parse(data);
		return profiles.map((p) => p.name);
	} catch {
		return [];
	}
}

export async function saveProfile(name: string, data: unknown): Promise<void> {
	const profiles = await getAllProfiles();
	const index = profiles.findIndex((p) => p.name === name);
	if (index !== -1 && profiles[index]) {
		profiles[index].data = data;
	} else {
		profiles.push({ name, data });
	}
	await fs.writeFile(STORAGE_PATH, JSON.stringify(profiles));
}

export async function loadProfile(name: string): Promise<unknown> {
	const profiles = await getAllProfiles();
	const profile = profiles.find((p) => p.name === name);
	return profile ? profile.data : null;
}

export async function deleteProfile(name: string): Promise<void> {
	let profiles = await getAllProfiles();
	profiles = profiles.filter((p) => p.name !== name);
	await fs.writeFile(STORAGE_PATH, JSON.stringify(profiles));
}

async function getAllProfiles(): Promise<Profile[]> {
	try {
		const data = await fs.readFile(STORAGE_PATH, 'utf-8');
		return JSON.parse(data);
	} catch {
		return [];
	}
}
