import { env } from "@obras360-project/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";

export function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: env.DATABASE_URL,
	});

	return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export const db = prisma;
export default prisma;
