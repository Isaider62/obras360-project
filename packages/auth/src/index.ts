import { expo } from "@better-auth/expo";
import { createPrismaClient } from "@obras360-project/db";
import { env } from "@obras360-project/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export function createAuth() {
	const prisma = createPrismaClient();

	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		trustedOrigins: [
			env.CORS_ORIGIN,
			"obras360-project://",
			...(env.NODE_ENV === "development"
				? [
						"exp://",
						"exp://**",
						"exp://192.168.*.*:*/**",
						"http://localhost:8081",
					]
				: []),
		],

		emailAndPassword: {
			enabled: true,
		},

		rateLimit: {
			enabled: true,
			window: 60,
			max: 100,
			customRules: {
				"/api/auth/sign-in/email": {
					window: 60,
					max: 5,
				},
				"/api/auth/sign-up/email": {
					window: 60,
					max: 3,
				},
			},
		},

		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			freshAge: 60 * 60,
			cookieCache: {
				enabled: true,
				maxAge: 300,
				strategy: "jwe",
			},
		},

		account: {
			encryptOAuthTokens: true,
		},

		databaseHooks: {
			session: {
				create: {
					after: async ({ data, ctx }) => {
						console.log(`[AUDIT] Session created for user ${data.userId}`);
					},
				},
				delete: {
					before: async ({ data }) => {
						console.log(`[AUDIT] Session revoked ${data.id}`);
					},
				},
			},
			user: {
				update: {
					after: async ({ data, oldData }) => {
						if (oldData?.email !== data.email) {
							console.log(`[AUDIT] Email changed for user ${data.id}`);
						}
					},
				},
			},
		},

		advanced: {
			useSecureCookies: true,
			defaultCookieAttributes: {
				sameSite: "lax",
				secure: true,
				httpOnly: true,
				path: "/",
			},
			ipAddress: {
				ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
			},
		},

		plugins: [expo()],
	});
}

export const auth = createAuth();
