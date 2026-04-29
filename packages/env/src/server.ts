import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const DEFAULT_SECRET_LENGTH = 32;

function validateSecret(secret: string | undefined): string {
	if (!secret) {
		throw new Error("BETTER_AUTH_SECRET is required");
	}

	if (process.env.NODE_ENV === "production") {
		if (secret.length < DEFAULT_SECRET_LENGTH) {
			throw new Error(
				`BETTER_AUTH_SECRET must be at least ${DEFAULT_SECRET_LENGTH} characters in production`,
			);
		}
		const weakSecrets = ["default", "secret", "password", "123456", "admin"];
		if (weakSecrets.some((s) => secret.toLowerCase().includes(s))) {
			throw new Error("BETTER_AUTH_SECRET contains a weak/common word");
		}
	}

	return secret;
}

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().transform(validateSecret),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
