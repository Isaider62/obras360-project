import * as ImagePicker from "expo-image-picker";
import { storageService, type UploadResult } from "./storage";

export interface FotoUpload {
	uri: string;
	name: string;
	type: string;
}

export async function pickFotos(): Promise<FotoUpload[]> {
	const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (status !== "granted") {
		throw new Error("Permissão negada para acessar fotos");
	}

	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images"],
		allowsEditing: false,
		quality: 0.8,
		selectionLimit: 5,
	});

	if (result.canceled || !result.assets?.length) {
		return [];
	}

	return result.assets.map((asset) => ({
		uri: asset.uri,
		name: asset.fileName || `foto_${Date.now()}.jpg`,
		type: asset.mimeType || "image/jpeg",
	}));
}

export async function takeFoto(): Promise<FotoUpload | null> {
	const { status } = await ImagePicker.requestCameraPermissionsAsync();
	if (status !== "granted") {
		throw new Error("Permissão negada para acessar câmera");
	}

	const result = await ImagePicker.launchCameraAsync({
		allowsEditing: false,
		quality: 0.8,
	});

	if (result.canceled || !result.assets?.[0]) {
		return null;
	}

	const asset = result.assets[0];
	return {
		uri: asset.uri,
		name: asset.fileName || `foto_${Date.now()}.jpg`,
		type: asset.mimeType || "image/jpeg",
	};
}

export async function uploadFotos(
	obraId: string,
	fotos: FotoUpload[],
): Promise<{ success: boolean; urls: string[]; errors: string[] }> {
	const urls: string[] = [];
	const errors: string[] = [];

	for (const foto of fotos) {
		const result: UploadResult = await storageService.uploadFoto(obraId, foto);
		if (result.success && result.url) {
			urls.push(result.url);
		} else {
			errors.push(result.error || "Upload falhou");
		}
	}

	return {
		success: errors.length === 0,
		urls,
		errors,
	};
}
