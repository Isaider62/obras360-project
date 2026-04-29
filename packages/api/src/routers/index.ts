import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { aiRouter } from "./ai";
import { alertasRouter } from "./alertas";
import { diariosRouter } from "./diarios";
import { exportRouter } from "./export";
import { financeRouter } from "./finance";
import { gestaoRouter } from "./gestao";
import { mediaRouter } from "./media";
import { obrasRouter } from "./obras";
import { pedidosRouter } from "./pedidos";
import { pontoRouter } from "./ponto";
import { solicitacoesRouter } from "./solicitacoes";
import { usuariosRouter } from "./usuarios";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),

	obras: obrasRouter,
	ponto: pontoRouter,
	diarios: diariosRouter,
	solicitacoes: solicitacoesRouter,
	pedidos: pedidosRouter,
	gestao: gestaoRouter,
	alertas: alertasRouter,
	media: mediaRouter,
	ai: aiRouter,
	usuarios: usuariosRouter,
	finance: financeRouter,
	export: exportRouter,

	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
