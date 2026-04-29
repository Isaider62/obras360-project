import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Card, Spinner, useThemeColor } from "heroui-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { useObra } from "@/presentation/hooks/useObras";

const STATUS_COLORS: Record<
	string,
	"primary" | "secondary" | "success" | "default"
> = {
	PLANEJAMENTO: "secondary",
	EM_ANDAMENTO: "primary",
	CONCLUIDO: "success",
	ARQUIVADO: "default",
};

export default function ObraDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const themeColorMuted = useThemeColor("muted");
	const themeColor = useThemeColor("foreground");

	const { obra, loading, error, refetch } = useObra(id);

	if (loading) {
		return (
			<Container className="flex-1 items-center justify-center">
				<Spinner size="lg" />
			</Container>
		);
	}

	if (error || !obra) {
		return (
			<Container className="flex-1 items-center justify-center">
				<Text className="mb-4 text-danger">Erro ao carregar obra</Text>
				<Button variant="solid" onPress={refetch}>
					Tentar novamente
				</Button>
			</Container>
		);
	}

	return (
		<Container className="flex-1">
			<ScrollView>
				<View className="mb-4 flex-row items-center justify-between">
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={themeColor} />
					</Pressable>
					<Badge color={STATUS_COLORS[obra.status]} variant="solid">
						{obra.status.replace("_", " ")}
					</Badge>
				</View>

				<Text className="mb-2 font-bold text-2xl">{obra.name}</Text>
				<Text className="mb-4 text-base" style={{ color: themeColorMuted }}>
					{obra.address || "Sem endereço"}
				</Text>

				<Card variant="bordered" className="mb-4 p-4">
					<View className="flex-row justify-between">
						<View>
							<Text className="text-sm" style={{ color: themeColorMuted }}>
								Início
							</Text>
							<Text className="font-medium">
								{obra.startDate
									? new Date(obra.startDate).toLocaleDateString("pt-BR")
									: "-"}
							</Text>
						</View>
						<View>
							<Text className="text-sm" style={{ color: themeColorMuted }}>
								Previsão
							</Text>
							<Text className="font-medium">
								{obra.endDate
									? new Date(obra.endDate).toLocaleDateString("pt-BR")
									: "-"}
							</Text>
						</View>
						<View>
							<Text className="text-sm" style={{ color: themeColorMuted }}>
								Orçamento
							</Text>
							<Text className="font-medium">
								{obra.budgetTotal
									? `R$ ${obra.budgetTotal.toLocaleString("pt-BR")}`
									: "-"}
							</Text>
						</View>
					</View>
				</Card>

				{obra.budgetCurrent && (
					<Card variant="bordered" className="mb-4 p-4">
						<View className="mb-2">
							<Text className="text-sm" style={{ color: themeColorMuted }}>
								Executado
							</Text>
							<Text className="font-semibold text-lg">
								R$ {obra.budgetCurrent.toLocaleString("pt-BR")}
							</Text>
						</View>
						<View className="h-2 overflow-hidden rounded-full bg-default-200">
							<View
								className="h-full bg-primary"
								style={{
									width: `${Math.min(
										(obra.budgetCurrent / (obra.budgetTotal || 1)) * 100,
										100,
									)}%`,
								}}
							/>
						</View>
						<Text className="mt-1 text-xs" style={{ color: themeColorMuted }}>
							{((obra.budgetCurrent / (obra.budgetTotal || 1)) * 100).toFixed(
								1,
							)}
							% do orçamento
						</Text>
					</Card>
				)}

				<Text className="mb-3 font-semibold text-lg">Ações Rápidas</Text>
				<View className="mb-4 flex-row gap-3">
					<Button
						variant="solid"
						className="flex-1"
						onPress={() => router.push(`/obras/${id}/solicitacao`)}
					>
						<Ionicons name="cart" size={20} />
						<Text className="ml-2">Solicitar</Text>
					</Button>
					<Button
						variant="bordered"
						className="flex-1"
						onPress={() => router.push(`/obras/${id}/ponto`)}
					>
						<Ionicons name="time" size={20} />
						<Text className="ml-2">Ponto</Text>
					</Button>
				</View>

				<View className="flex-row gap-3">
					<Button
						variant="light"
						className="flex-1"
						onPress={() => router.push(`/obras/${id}/diario`)}
					>
						<Ionicons name="book" size={20} />
						<Text className="ml-2">Diário</Text>
					</Button>
					<Button
						variant="light"
						className="flex-1"
						onPress={() => router.push(`/obras/${id}/fotos`)}
					>
						<Ionicons name="camera" size={20} />
						<Text className="ml-2">Fotos</Text>
					</Button>
				</View>

				<View className="mt-3 flex-row gap-3">
					<Button
						variant="light"
						className="flex-1"
						onPress={() => router.push(`/obras/${id}/timeline`)}
					>
						<Ionicons name="time" size={20} />
						<Text className="ml-2">Timeline</Text>
					</Button>
					<Button
						variant="light"
						className="flex-1"
						onPress={() => router.push(`/obras/${id}/curva-s`)}
					>
						<Ionicons name="trending-up" size={20} />
						<Text className="ml-2">Curva S</Text>
					</Button>
				</View>

				<View className="mt-3 flex-row gap-3">
					<Button
						variant="light"
						className="flex-1"
						onPress={() => router.push(`/obras/${id}/financeiro`)}
					>
						<Ionicons name="cash" size={20} />
						<Text className="ml-2">Financeiro</Text>
					</Button>
				</View>
			</ScrollView>
		</Container>
	);
}
