import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

interface NotificationPayload {
	type: "NEW_SOLICITACAO" | "STATUS_CHANGED" | "ALERTA";
	obraId?: string;
	item?: string;
	solicitacaoId?: string;
	status?: string;
	alertaId?: string;
	message: string;
}

export function useSupabaseRealtime() {
	const [payload, setPayload] = useState<NotificationPayload | null>(null);

	useEffect(() => {
		const channel = supabase
			.channel("notifications")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "NotificationQueue",
				},
				(notif) => {
					setPayload(notif.new as unknown as NotificationPayload);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	return payload;
}

export function useNotificationSubscription(
	userId: string,
	handlers: {
		onNewSolicitacao?: (data: { obraId: string; item: string }) => void;
		onStatusChanged?: (data: { solicitacaoId: string; status: string }) => void;
		onAlerta?: (data: { alertaId: string; message: string }) => void;
	},
) {
	const [payload, setPayload] = useState<NotificationPayload | null>(null);

	useEffect(() => {
		if (!userId) return;

		const channel = supabase
			.channel(`user-notifications-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "NotificationQueue",
					filter: `userId=eq.${userId}`,
				},
				(notif) => {
					const data = notif.new as unknown as NotificationPayload;
					setPayload(data);

					if (data.type === "NEW_SOLICITACAO" && handlers.onNewSolicitacao) {
						handlers.onNewSolicitacao({
							obraId: data.obraId || "",
							item: data.item || "",
						});
					} else if (
						data.type === "STATUS_CHANGED" &&
						handlers.onStatusChanged
					) {
						handlers.onStatusChanged({
							solicitacaoId: data.solicitacaoId || "",
							status: data.status || "",
						});
					} else if (data.type === "ALERTA" && handlers.onAlerta) {
						handlers.onAlerta({
							alertaId: data.alertaId || "",
							message: data.message,
						});
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId]);

	return payload;
}

export async function registerDeviceToken(
	userId: string,
	token: string,
	platform: "mobile" | "web" | "ios" | "android" = "mobile",
) {
	const { error } = await supabase.from("DeviceToken").upsert(
		{
			userId,
			token,
			platform,
			active: true,
		},
		{ onConflict: "userId,token" },
	);

	if (error) throw error;
}

export async function unregisterDeviceToken(userId: string, token: string) {
	const { error } = await supabase
		.from("DeviceToken")
		.update({ active: false })
		.eq("userId", userId)
		.eq("token", token);

	if (error) throw error;
}
