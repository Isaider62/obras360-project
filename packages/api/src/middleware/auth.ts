import { ORPCError } from "@orpc/server";
import type { Context } from "../context";

export type Perfil = "ENCARREGADO" | "COMPRAS" | "GESTAO";

export type Permissao =
	| "OBRA:LEitura"
	| "OBRA:Escrita"
	| "OBRA:Criar"
	| "SOLICITACAO:Leitura"
	| "SOLICITACAO:Criar"
	| "SOLICITACAO:Processar"
	| "PONTO:Registrar"
	| "PONTO:Relatorio"
	| "DIARIO:Leitura"
	| "DIARIO:Criar"
	| "DASHBOARD:GLOBAL"
	| "DASHBOARD:OBRA"
	| "DASHBOARD:KPIs"
	| "ALERTA:Leitura"
	| "ALERTA:Criar"
	| "ADMIN:Usuarios";

const PERMISSOES: Record<Perfil, Permissao[]> = {
	ENCARREGADO: [
		"OBRA:Leitura",
		"OBRA:Escrita",
		"SOLICITACAO:Leitura",
		"SOLICITACAO:Criar",
		"PONTO:Registrar",
		"DIARIO:Leitura",
		"DIARIO:Criar",
		"DASHBOARD:OBRA",
		"ALERTA:Leitura",
		"ALERTA:Criar",
	],
	COMPRAS: [
		"OBRA:Leitura",
		"SOLICITACAO:Leitura",
		"SOLICITACAO:Processar",
		"PONTO:Relatorio",
		"DASHBOARD:KPIs",
		"ALERTA:Leitura",
	],
	GESTAO: [
		"OBRA:Leitura",
		"OBRA:Escrita",
		"OBRA:Criar",
		"SOLICITACAO:Leitura",
		"SOLICITACAO:Criar",
		"SOLICITACAO:Processar",
		"PONTO:Registrar",
		"PONTO:Relatorio",
		"DIARIO:Leitura",
		"DIARIO:Criar",
		"DASHBOARD:GLOBAL",
		"DASHBOARD:OBRA",
		"DASHBOARD:KPIs",
		"ALERTA:Leitura",
		"ALERTA:Criar",
		"ADMIN:Usuarios",
	],
};

export function temPermissao(perfil: Perfil, permissao: Permissao): boolean {
	return PERMISSOES[perfil]?.includes(permissao) ?? false;
}

export function temAlgumaPermissao(
	perfil: Perfil,
	permissoes: Permissao[],
): boolean {
	return permissoes.some((p) => temPermissao(perfil, p));
}

export function requerAutenticacao() {
	return async ({ context }: { context: Context }) => {
		if (!context.session?.user) {
			throw new ORPCError({
				code: "UNAUTHORIZED",
				message: "Usuário não autenticado",
			});
		}
	};
}

export function requerPerfil(...perfis: Perfil[]) {
	return async ({ context }: { context: Context }) => {
		if (!context.session?.user) {
			throw new ORPCError({
				code: "UNAUTHORIZED",
				message: "Usuário não autenticado",
			});
		}

		const usuarioPerfil = context.session.user.perfil as Perfil;
		if (!perfis.includes(usuarioPerfil)) {
			throw new ORPCError({
				code: "FORBIDDEN",
				message: `AcessoRestrito. needed: ${perfis.join(", ")}`,
			});
		}
	};
}

export function requerPermissao(...permissoes: Permissao[]) {
	return async ({ context }: { context: Context }) => {
		if (!context.session?.user) {
			throw new ORPCError({
				code: "UNAUTHORIZED",
				message: "Usuário não autenticado",
			});
		}

		const usuarioPerfil =
			(context.session.user.perfil as Perfil) || "ENCARREGADO";
		const temAlguma = permissoes.some((p) => temPermissao(usuarioPerfil, p));

		if (!temAlguma) {
			throw new ORPCError({
				code: "FORBIDDEN",
				message: "Permissão insuficiente para esta ação",
			});
		}
	};
}

export function obterPerfil(session: Context["session"]): Perfil {
	return (session?.user?.perfil as Perfil) || "ENCARREGADO";
}

export function verificarAcessoObra(
	perfil: Perfil,
	obraId: string,
	encerregadoId?: string | null,
): boolean {
	if (perfil === "GESTAO") {
		return true;
	}

	if (perfil === "ENCARREGADO" && obraId === encerregadoId) {
		return true;
	}

	return false;
}
