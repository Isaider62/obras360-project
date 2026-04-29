import { createAuthClient } from "@better-auth/expo";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
	baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
	secureStorage: {
		async getItem(key: string) {
			const value = await SecureStore.getItemAsync(key);
			return value ?? null;
		},
		async setItem(key: string, value: string) {
			await SecureStore.setItemAsync(key, value);
		},
		async removeItem(key: string) {
			await SecureStore.deleteItemAsync(key);
		},
	},
});

export const { useSession, signIn, signOut, signUp, useClient } = authClient;

export function getCurrentSession() {
	return authClient.getSession();
}

export function refreshSession() {
	return authClient.refreshSession();
}

export type Session = Awaited<ReturnType<typeof getCurrentSession>>;
