import { SUPABASE_BUCKET, supabase } from "./supabase";

export interface UploadResult {
	success: boolean;
	url?: string;
	path?: string;
	error?: string;
}

export interface StorageService {
	uploadFoto(
		obraId: string,
		file: { uri: string; name: string; type: string },
	): Promise<UploadResult>;
	uploadVoz(
		obraId: string,
		file: { uri: string; name: string; type: string },
	): Promise<UploadResult>;
	deleteFile(path: string): Promise<{ success: boolean; error?: string }>;
	getSignedUrl(path: string, expiresIn?: number): Promise<string | null>;
}

class SupabaseStorageService implements StorageService {
	private bucket = SUPABASE_BUCKET;

	async uploadFoto(
		obraId: string,
		file: { uri: string; name: string; type: string },
	): Promise<UploadResult> {
		try {
			const timestamp = Date.now();
			const fileName = `${obraId}/fotos/${timestamp}_${file.name}`;
			const fileBuffer = await this.uriToBlob(file.uri);

			const { error } = await supabase.storage
				.from(this.bucket)
				.upload(fileName, fileBuffer, {
					contentType: file.type,
					upsert: false,
				});

			if (error) {
				return { success: false, error: error.message };
			}

			const { data: urlData } = supabase.storage
				.from(this.bucket)
				.getPublicUrl(fileName);

			return {
				success: true,
				url: urlData.publicUrl,
				path: fileName,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Upload failed",
			};
		}
	}

	async uploadVoz(
		obraId: string,
		file: { uri: string; name: string; type: string },
	): Promise<UploadResult> {
		try {
			const timestamp = Date.now();
			const fileName = `${obraId}/voz/${timestamp}_${file.name}`;
			const fileBuffer = await this.uriToBlob(file.uri);

			const { error } = await supabase.storage
				.from(this.bucket)
				.upload(fileName, fileBuffer, {
					contentType: file.type,
					upsert: false,
				});

			if (error) {
				return { success: false, error: error.message };
			}

			const { data: urlData } = supabase.storage
				.from(this.bucket)
				.getPublicUrl(fileName);

			return {
				success: true,
				url: urlData.publicUrl,
				path: fileName,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Upload failed",
			};
		}
	}

	async deleteFile(
		path: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			const { error } = await supabase.storage.from(this.bucket).remove([path]);

			if (error) {
				return { success: false, error: error.message };
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Delete failed",
			};
		}
	}

	async getSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
		try {
			const { error } = await supabase.storage
				.from(this.bucket)
				.createSignedUrl(path, expiresIn);

			if (error) {
				console.error("Signed URL error:", error);
				return null;
			}

			return data.signedUrl;
		} catch (error) {
			console.error("Signed URL error:", error);
			return null;
		}
	}

	private async uriToBlob(uri: string): Promise<Blob> {
		const response = await fetch(uri);
		return response.blob();
	}
}

export const storageService = new SupabaseStorageService();
