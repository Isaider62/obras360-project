import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Container } from "@/components/container";
import { SyncStatus } from "@/presentation/hooks/components/SyncStatus";
import { useObras } from "@/presentation/hooks/useObras";

type StatusFilter = "TODAS" | "PLANEJAMENTO" | "EM_ANDAMENTO" | "CONCLUIDO";

const STATUS_COLORS: Record<string, string> = {
	PLANEJAMENTO: "secondary",
	EM_ANDAMENTO: "primary",
	CONCLUIDO: "success",
	ARQUIVADO: "default",
};

export default function ObrasScreen() {
	const themeColorMuted = useThemeColor("muted");
	const router = useRouter();
	const { obras, loading, error, refetch } = useObras();
	const [filter, setFilter] = useState<StatusFilter>("TODAS");

	const filteredObras =
		filter === "TODAS" ? obras : obras.filter((o) => o.status === filter);

	const renderObra = ({ item }: { item: obras[0] }) => (
		<Pressable onPress={() => router.push(`/obras/${item.id}`)}>
			<Card variant="bordered" className="mb-3 p-4">
				<View className="flex-row items-start justify-between">
					<View className="flex-1">
						<Text className="mb-1 font-semibold text-lg">{item.name}</Text>
						<Text className="text-sm" style={{ color: themeColorMuted }}>
							{item.address || "Sem endereço"}
						</Text>
						<View className="mt-2 flex-row gap-2">
							{item.budgetTotal && (
								<Text className="text-xs">
									Orçamento: R$ {item.budgetTotal.toLocaleString("pt-BR")}
								</Text>
							)}
						</View>
					</View>
					<Badge
						color={
							STATUS_COLORS[item.status] as
								| "primary"
								| "secondary"
								| "success"
								| "default"
						}
						variant="solid"
					>
						{item.status.replace("_", " ")}
					</Badge>
				</View>
			</Card>
		</Pressable>
	);

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center justify-between">
				<Text className="font-bold text-2xl">Obras</Text>
				<View className="flex-row items-center gap-2">
					<SyncStatus showLabel={false} />
					<Button
						variant="light"
						size="sm"
						onPress={() => router.push("/obras/nova")}
					>
						<Text>Nova</Text>
						<Ionicons name="add" size={20} />
					</Button>
				</View>
			</View>

			<View className="mb-4 flex-row gap-2">
				{(["TODAS", "PLANEJAMENTO", "EM_ANDAMENTO", "CONCLUIDO"] as const).map(
					(s) => (
						<Button
							key={s}
							variant={filter === s ? "solid" : "light"}
							size="sm"
							onPress={() => setFilter(s)}
						>
							<Text>{s.replace("_", " ")}</Text>
						</Button>
					),
				)}
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : error ? (
				<View className="flex-1 items-center justify-center">
					<Text className="mb-4 text-danger">Erro ao carregar obras</Text>
					<Button variant="solid" onPress={refetch}>
						Tentar novamente
					</Button>
				</View>
			) : filteredObras.length === 0 ? (
				<View className="flex-1 items-center justify-center">
					<Ionicons
						name="construct"
						size={48}
						style={{ color: themeColorMuted }}
					/>
					<Text className="mt-4" style={{ color: themeColorMuted }}>
						Nenhuma obra encontrada
					</Text>
				</View>
			) : (
				<FlatList
					data={filteredObras as never[]}
					renderItem={renderObra}
					keyExtractor={(item) => item.id}
					contentContainerClassName="pb-4"
				/>
			)}
		</Container>
	);
}
