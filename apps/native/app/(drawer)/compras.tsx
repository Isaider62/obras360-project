import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Spinner, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { api } from "@/lib/api";

type StatusPedido =
	| "AGUARDANDO"
	| "COTANDO"
	| "APROVADO"
	| "COMPRADO"
	| "ENVIADO"
	| "ENTREGUE";

interface Pedido {
	id: string;
	solicitacaoId: string;
	totalValue: number;
	status: StatusPedido;
	createdAt: Date;
}

const COLUMNS: { status: StatusPedido; label: string; color: string }[] = [
	{ status: "AGUARDANDO", label: "Aguardando", color: "default" },
	{ status: "COTANDO", label: "Cotando", color: "warning" },
	{ status: "APROVADO", label: "Aprovado", color: "primary" },
	{ status: "COMPRADO", label: "Comprado", color: "secondary" },
	{ status: "ENVIADO", label: "Enviado", color: "secondary" },
	{ status: "ENTREGUE", label: "Entregue", color: "success" },
];

export default function KanbanScreen() {
	const router = useRouter();
	const themeColorMuted = useThemeColor("muted");
	const themeColor = useThemeColor("foreground");

	const [pedidos, setPedidos] = useState<Record<StatusPedido, Pedido[]>>({
		AGUARDANDO: [],
		COTANDO: [],
		APROVADO: [],
		COMPRADO: [],
		ENVIADO: [],
		ENTREGUE: [],
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadPedidos();
	}, []);

	const loadPedidos = async () => {
		try {
			setLoading(true);
			const result = await api.pedidos.list({});
			const grouped = result.reduce(
				(acc, pedido) => {
					const status = pedido.status as StatusPedido;
					if (acc[status]) {
						acc[status].push(pedido);
					}
					return acc;
				},
				{} as Record<StatusPedido, Pedido[]>,
			);
			setPedidos(grouped);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const handleMove = async (pedidoId: string, newStatus: StatusPedido) => {
		try {
			await api.pedidos.updateStatus({
				id: pedidoId,
				status: newStatus,
			});
			loadPedidos();
		} catch (e) {
			console.error(e);
		}
	};

	const renderPedido = ({ item }: { item: Pedido }) => {
		const column = COLUMNS.find((c) => c.status === item.status);
		const nextStatus = getNextStatus(item.status);

		return (
			<Card variant="bordered" className="mb-2 p-3">
				<Text className="mb-1 font-medium">Pedido #{item.id.slice(0, 8)}</Text>
				<Text className="text-sm" style={{ color: themeColorMuted }}>
					R$ {item.totalValue.toLocaleString("pt-BR")}
				</Text>
				{nextStatus && (
					<Button
						variant="light"
						size="sm"
						className="mt-2"
						onPress={() => handleMove(item.id, nextStatus.status)}
					>
						{move → ${nextStatus.label}
					</Button>
				)}
			</Card>
		);
	};

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center justify-between">
				<Pressable onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color={themeColor} />
				</Pressable>
				<Text className="font-bold text-xl">Compras</Text>
				<Button
					variant="light"
					size="sm"
					onPress={() => router.push("/compras/nova")}
				>
					<Text>Novo</Text>
				</Button>
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : (
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					<View className="flex-row gap-3 pb-4">
						{COLUMNS.map((column) => (
							<View key={column.status} className="w-64">
								<View className="mb-2 flex-row items-center">
									<Badge
										color={
											column.color as
												| "primary"
												| "secondary"
												| "success"
												| "warning"
												| "default"
										}
										variant="solid"
									>
										{pedidos[column.status]?.length || 0}
									</Badge>
									<Text className="ml-2 font-semibold">{column.label}</Text>
								</View>
								<FlatList
									data={pedidos[column.status] || []}
									renderItem={renderPedido}
									keyExtractor={(item) => item.id}
									scrollEnabled={false}
									ListEmptyComponent={
										<Text
											className="py-8 text-center"
											style={{ color: themeColorMuted }}
										>
											Nenhum pedido
										</Text>
									}
								/>
							</View>
						))}
					</View>
				</ScrollView>
			)}
		</Container>
	);
}

function getNextStatus(
	current: StatusPedido,
): { status: StatusPedido; label: string } | null {
	const flow: Record<
		StatusPedido,
		{ status: StatusPedido; label: string } | null
	> = {
		AGUARDANDO: { status: "COTANDO", label: "Cotar" },
		COTANDO: { status: "APROVADO", label: "Aprovar" },
		APROVADO: { status: "COMPRADO", label: "Comprar" },
		COMPRADO: { status: "ENVIADO", label: "Marcar Enviado" },
		ENVIADO: { status: "ENTREGUE", label: "Confirmar" },
		ENTREGUE: null,
	};
	return flow[current];
}
