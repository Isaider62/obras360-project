import type { AppRouter } from "@obras360-project/api/src/routers/index";
import { createORPCClient } from "@orpc/client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const api = createORPCClient<AppRouter>({
	baseUrl: `${API_URL}/rpc`,
	async fetch(url, init) {
		const session = await import("./auth").then((m) => m.getCurrentSession());
		const headers = new Headers(init?.headers);
		headers.set("Content-Type", "application/json");
		if (session?.session) {
			headers.set("Authorization", `Bearer ${session.session.token}`);
		}
		return fetch(url, {
			...init,
			headers,
		});
	},
});

export type ApiClient = typeof api;
