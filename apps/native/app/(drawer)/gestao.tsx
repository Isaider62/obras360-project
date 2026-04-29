import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Spinner, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { api } from "@/lib/api";

interface DashboardData {
	obras: {
		total: number;
		emAndamento: number;
		concluidas: number;
	};
	solicitacoes: {
		pendentes: number;
	};
	compras: {
		emCotacao: number;
		comprados: number;
	};
	financeiro: {
		orcamentoTotal: number;
		executado: number;
	};
}

export default function DashboardScreen() {
	const router = useRouter();
	const themeColorMuted = useThemeColor("muted");
	const themeColor = useThemeColor("foreground");

	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadDashboard();
	}, []);

	const loadDashboard = async () => {
		try {
			setLoading(true);
			const result = await api.gestao.dashboard();
			setData(result);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<Container className="flex-1 items-center justify-center">
				<Spinner size="lg" />
			</Container>
		);
	}

	const orcamentoPct = data?.financeiro.orcamentoTotal
		? (data.financeiro.executado / data.financeiro.orcamentoTotal) * 100
		: 0;

	return (
		<Container className="flex-1">
			<ScrollView>
				<Text className="mb-6 font-bold text-2xl">Dashboard</Text>

				<Text className="mb-3 font-semibold text-lg">Obras</Text>
				<View className="mb-6 flex-row gap-3">
					<Card variant="bordered" className="flex-1 p-4">
						<Text className="font-bold text-3xl">{data?.obras.total}</Text>
						<Text style={{ color: themeColorMuted }}>Total</Text>
					</Card>
					<Card variant="bordered" className="flex-1 p-4">
						<Text className="font-bold text-3xl text-warning">
							{data?.obras.emAndamento}
						</Text>
						<Text style={{ color: themeColorMuted }}>Em Andamento</Text>
					</Card>
					<Card variant="bordered" className="flex-1 p-4">
						<Text className="font-bold text-3xl text-success">
							{data?.obras.concluidas}
						</Text>
						<Text style={{ color: themeColorMuted }}>Concluídas</Text>
					</Card>
				</View>

				<Text className="mb-3 font-semibold text-lg">Solicitações</Text>
				<Card
					variant="bordered"
					className="mb-6 p-4"
					onPress={() => router.push("/obras")}
				>
					<View className="flex-row items-center">
						<View className="flex-1">
							<Text className="font-bold text-3xl text-warning">
								{data?.solicitacoes.pendentes}
							</Text>
							<Text style={{ color: themeColorMuted }}>Pendentes</Text>
						</View>
						<Ionicons
							name="chevron-forward"
							size={24}
							color={themeColorMuted}
						/>
					</View>
				</Card>

				<Text className="mb-3 font-semibold text-lg">Compras</Text>
				<View className="mb-6 flex-row gap-3">
					<Card variant="bordered" className="flex-1 p-4">
						<Text className="font-bold text-3xl text-warning">
							{data?.compras.emCotacao}
						</Text>
						<Text style={{ color: themeColorMuted }}>Em Cotação</Text>
					</Card>
					<Card variant="bordered" className="flex-1 p-4">
						<Text className="font-bold text-3xl text-primary">
							{data?.compras.comprados}
						</Text>
						<Text style={{ color: themeColorMuted }}>Comprados</Text>
					</Card>
				</View>

				<Text className="mb-3 font-semibold text-lg">Financeiro</Text>
				<Card variant="bordered" className="p-4">
					<View className="mb-2 flex-row justify-between">
						<Text style={{ color: themeColorMuted }}>Orçamento Total</Text>
						<Text className="font-semibold">
							R$ {data?.financeiro.orcamentoTotal.toLocaleString("pt-BR")}
						</Text>
					</View>
					<View className="mb-2 flex-row justify-between">
						<Text style={{ color: themeColorMuted }}>Executado</Text>
						<Text className="font-semibold">
							R$ {data?.financeiro.executado.toLocaleString("pt-BR")}
						</Text>
					</View>
					<View className="mt-2 h-2 overflow-hidden rounded-full bg-default-200">
						<View
							className="h-full bg-success"
							style={{ width: `${Math.min(orcamentoPct, 100)}%` }}
						/>
					</View>
					<Text className="mt-1 text-sm" style={{ color: themeColorMuted }}>
						{orcamentoPct.toFixed(1)}% executado
					</Text>
				</Card>
			</ScrollView>
		</Container>
	);
}
