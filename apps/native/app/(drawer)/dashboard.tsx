import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
	Card,
	Pressable,
	Spinner,
	Text,
	useThemeColor,
	View,
} from "heroui-native";
import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { api } from "@/lib/api";

interface ComprasStats {
	total: number;
	urgentes: number;
	pendentes: number;
	emAnalise: number;
	entregues: number;
	ultimos30: number;
	tempoMedio: number | null;
}

export default function DashboardScreen() {
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<ComprasStats | null>(null);

	useEffect(() => {
		api.solicitacoes
			.stats()
			.then(setStats)
			.finally(() => setLoading(false));
	}, []);

	const kpis = [
		{
			label: "Total",
			value: stats?.total ?? 0,
			icon: "document-text",
			color: "#3B82F6",
		},
		{
			label: "Pendentes",
			value: stats?.pendentes ?? 0,
			icon: "time",
			color: "#F59E0B",
		},
		{
			label: "Urgentes",
			value: stats?.urgentes ?? 0,
			icon: "warning",
			color: "#EF4444",
		},
		{
			label: "Em Análise",
			value: stats?.emAnalise ?? 0,
			icon: "eye",
			color: "#8B5CF6",
		},
		{
			label: "Entregues",
			value: stats?.entregues ?? 0,
			icon: "checkmark-circle",
			color: "#10B981",
		},
		{
			label: "Últimos 30 dias",
			value: stats?.ultimos30 ?? 0,
			icon: "calendar",
			color: "#06B6D4",
		},
	];

	return (
		<Container className="flex-1">
			<View className="mb-6">
				<Text className="font-bold text-2xl">Dashboard Compras</Text>
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : (
				<View className="flex-row flex-wrap justify-between">
					{kpis.map((kpi) => (
						<Pressable
							key={kpi.label}
							className="mb-4 w-[48%]"
							onPress={() => router.push("/gestao")}
						>
							<Card variant="bordered" className="p-4">
								<View className="flex-row items-center">
									<View
										className="h-12 w-12 items-center justify-center rounded-full"
										style={{ backgroundColor: kpi.color + "20" }}
									>
										<Ionicons
											name={kpi.icon as any}
											size={24}
											color={kpi.color}
										/>
									</View>
									<View className="ml-3 flex-1">
										<Text
											style={{ color: themeColorMuted }}
											className="text-sm"
										>
											{kpi.label}
										</Text>
										<Text className="font-bold text-2xl">{kpi.value}</Text>
									</View>
								</View>
							</Card>
						</Pressable>
					))}
				</View>
			)}

			{stats?.tempoMedio && (
				<Card variant="secondary" className="mt-4 p-4">
					<View className="flex-row items-center">
						<Ionicons name="hourglass" size={20} color={themeColor} />
						<Text className="ml-2">
							Tempo médio de entrega: {stats.tempoMedio}h
						</Text>
					</View>
				</Card>
			)}
		</Container>
	);
}
