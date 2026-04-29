import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Card, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { api } from "@/lib/api";
import { useOffline } from "@/presentation/hooks/useOffline";

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
	FALTA_MATERIAL: { label: "Falta Material", icon: "cube-outline" },
	ATRASO: { label: "Atraso", icon: "time-outline" },
	INTERFERENCIA: { label: "Interferência", icon: "warning-outline" },
	CUSTO: { label: "Custo", icon: "cash-outline" },
	PRAZO: { label: "Prazo", icon: "calendar-outline" },
	SINCRONIZACAO: { label: "Sincronização", icon: "sync-outline" },
};

const SEVERITY_COLORS: Record<
	string,
	"primary" | "warning" | "danger" | "default" | "success"
> = {
	INFO: "primary",
	WARNING: "warning",
	ALERT: "danger",
	CRITICAL: "danger",
};

export default function AlertasScreen() {
	const { obraId } = useLocalSearchParams<{ obraId: string }>();
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");
	const { isOnline } = useOffline();

	const [alertas, setAlertas] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const loadAlertas = async () => {
		try {
			setLoading(true);
			const result = await api.alertas.listByObra({
				obraId: obraId || "",
				limit: 50,
			});
			setAlertas(result);
		} catch (e) {
			console.error("Erro ao carregar alertas:", e);
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		if (!isOnline) return;
		setRefreshing(true);
		await loadAlertas();
		setRefreshing(false);
	};

	const handleResolve = async (id: string) => {
		if (!isOnline) return;
		try {
			await api.alertas.resolve({
				id,
				resolution: "Resolvido pelo encarregado",
			});
			setAlertas((prev) =>
				prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
			);
		} catch (e) {
			console.error("Erro ao resolver:", e);
		}
	};

	const ativos = alertas.filter((a) => !a.resolved);

	const renderAlerta = ({ item }: { item: any }) => {
		const typeInfo = TYPE_LABELS[item.type] || {
			label: item.type,
			icon: "alert-circle",
		};
		const severityColor = SEVERITY_COLORS[item.severity] || "default";

		return (
			<Card variant="bordered" className="mb-3 p-3">
				<View className="flex-row items-start gap-3">
					<View className={`rounded-full p-2 bg-${severityColor}/20`}>
						<Ionicons
							name={typeInfo.icon as any}
							size={20}
							color={themeColor}
						/>
					</View>
					<View className="flex-1">
						<View className="mb-1 flex-row items-center gap-2">
							<Text className="flex-1 font-semibold">{item.title}</Text>
							<Badge color={severityColor} variant="solid" size="sm">
								{item.severity}
							</Badge>
						</View>
						<Text className="text-sm" style={{ color: themeColorMuted }}>
							{typeInfo.label}
						</Text>
						{item.description && (
							<Text className="mt-2 text-sm" style={{ color: themeColorMuted }}>
								{item.description}
							</Text>
						)}
						<Text className="mt-2 text-xs" style={{ color: themeColorMuted }}>
							{new Date(item.createdAt).toLocaleString("pt-BR")}
						</Text>
						{!item.resolved && (
							<Button
								variant="light"
								size="sm"
								className="mt-2"
								onPress={() => handleResolve(item.id)}
								disabled={!isOnline}
							>
								<Text className="text-sm">Marcar como resolvido</Text>
							</Button>
						)}
					</View>
				</View>
			</Card>
		);
	};

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center justify-between">
				<Pressable onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color={themeColor} />
				</Pressable>
				<Text className="font-bold text-xl">Alertas</Text>
				<Pressable onPress={() => router.push(`/obras/${obraId}/alerta/nova`)}>
					<Ionicons name="add" size={24} color={themeColor} />
				</Pressable>
			</View>

			{!isOnline && (
				<View className="mb-3 flex-row items-center gap-2 rounded bg-warning/20 p-2">
					<Ionicons name="cloud-offline" size={16} />
					<Text className="text-sm">
						Modo offline - alertas podem estar desatualizados
					</Text>
				</View>
			)}

			<View className="mb-4 flex-row gap-2">
				<Badge color="warning" variant="solid">
					{ativos.length} ativos
				</Badge>
				<Badge color="success" variant="solid">
					{alertas.length - ativos.length} resolvidos
				</Badge>
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : alertas.length === 0 ? (
				<View className="flex-1 items-center justify-center">
					<Ionicons
						name="checkmark-circle"
						size={48}
						style={{ color: themeColorMuted }}
					/>
					<Text className="mt-4" style={{ color: themeColorMuted }}>
						Nenhum alerta registrado
					</Text>
				</View>
			) : (
				<FlatList
					data={alertas}
					renderItem={renderAlerta}
					keyExtractor={(item) => item.id}
					refreshControl={
						isOnline
							? {
									refreshing,
									onRefresh: handleRefresh,
								}
							: undefined
					}
				/>
			)}
		</Container>
	);
}
