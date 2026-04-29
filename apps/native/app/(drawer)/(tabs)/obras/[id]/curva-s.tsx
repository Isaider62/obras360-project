import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

interface CurvaSData {
	planned: { date: string; progress: number }[];
	actual: { date: string; progress: number }[];
	summary: {
		startDate: string | null;
		endDate: string | null;
		budgetTotal: number;
		budgetExecuted: number;
		expectedToday: number;
		actualToday: number;
	};
}

export default function CurvaSScreen() {
	const { id: obraId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");

	const [data, setData] = useState<CurvaSData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (obraId) {
			api.obras
				.curvaS({ obraId })
				.then(setData)
				.finally(() => setLoading(false));
		}
	}, [obraId]);

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return "-";
		return new Date(dateStr).toLocaleDateString("pt-BR", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const diff = data?.summary
		? data.summary.actualToday - data.summary.expectedToday
		: 0;

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center">
				<Pressable onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color={themeColor} />
				</Pressable>
				<Text className="ml-3 font-bold text-xl">Curva S</Text>
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : data ? (
				<View>
					<Card variant="bordered" className="mb-4 p-4">
						<Text className="mb-3 font-semibold">Resumo</Text>
						<View className="mb-2 flex-row justify-between">
							<View>
								<Text style={{ color: themeColorMuted }} className="text-sm">
									Início
								</Text>
								<Text>{formatDate(data.summary.startDate)}</Text>
							</View>
							<View>
								<Text style={{ color: themeColorMuted }} className="text-sm">
									Fim Previsto
								</Text>
								<Text>{formatDate(data.summary.endDate)}</Text>
							</View>
						</View>
					</Card>

					<Card variant="bordered" className="mb-4 p-4">
						<Text className="mb-3 font-semibold">Progresso Hoje</Text>
						<View className="flex-row items-center justify-between">
							<View className="items-center">
								<Text style={{ color: themeColorMuted }} className="text-sm">
									Esperado
								</Text>
								<Text className="font-bold text-2xl">
									{data.summary.expectedToday}%
								</Text>
							</View>
							<View className="items-center">
								<Text style={{ color: themeColorMuted }} className="text-sm">
									Real
								</Text>
								<Text
									className={`font-bold text-2xl ${
										diff >= 0 ? "text-success" : "text-danger"
									}`}
								>
									{data.summary.actualToday}%
								</Text>
							</View>
						</View>
						<View className="mt-3 flex-row items-center justify-center">
							<Ionicons
								name={diff >= 0 ? "arrow-up" : "arrow-down"}
								size={16}
								color={diff >= 0 ? "#10B981" : "#EF4444"}
							/>
							<Text
								className={`ml-1 text-sm ${
									diff >= 0 ? "text-success" : "text-danger"
								}`}
							>
								{Math.abs(diff)}% {diff >= 0 ? "adiantado" : "atrasado"}
							</Text>
						</View>
					</Card>

					<Card variant="bordered" className="mb-4 p-4">
						<Text className="mb-3 font-semibold">Orçamento</Text>
						<View className="mb-2 flex-row justify-between">
							<View>
								<Text style={{ color: themeColorMuted }} className="text-sm">
									Total
								</Text>
								<Text className="font-semibold">
									{formatCurrency(data.summary.budgetTotal)}
								</Text>
							</View>
							<View>
								<Text style={{ color: themeColorMuted }} className="text-sm">
									Executado
								</Text>
								<Text className="font-semibold">
									{formatCurrency(data.summary.budgetExecuted)}
								</Text>
							</View>
						</View>
						<View className="h-2 overflow-hidden rounded-full bg-default-200">
							<View
								className="h-full rounded-full bg-success"
								style={{
									width: `${
										data.summary.budgetTotal > 0
											? (
													data.summary.budgetExecuted / data.summary.budgetTotal
												) * 100
											: 0
									}%`,
								}}
							/>
						</View>
					</Card>

					<Card variant="bordered" className="p-4">
						<Text className="mb-3 font-semibold">Evolução</Text>
						{data.actual.length > 0 ? (
							<View>
								{data.actual.map((a, i) => {
									const p = data.planned.find((p) => p.date === a.date);
									return (
										<View
											key={a.date}
											className="flex-row justify-between py-2"
										>
											<Text className="text-sm">{formatDate(a.date)}</Text>
											<View className="flex-row gap-4">
												<Text
													style={{ color: themeColorMuted }}
													className="w-12 text-right text-sm"
												>
													{p?.progress || 0}%
												</Text>
												<Text
													className={`w-12 text-right font-semibold text-sm ${
														a.progress >= (p?.progress || 0)
															? "text-success"
															: "text-danger"
													}`}
												>
													{a.progress}%
												</Text>
											</View>
										</View>
									);
								})}
							</View>
						) : (
							<Text style={{ color: themeColorMuted }}>
								Nenhum registro de progresso
							</Text>
						)}
					</Card>
				</View>
			) : (
				<View className="flex-1 items-center justify-center">
					<Ionicons
						name="analytics-outline"
						size={48}
						color={themeColorMuted}
					/>
					<Text style={{ color: themeColorMuted }} className="mt-2">
						Sem dados
					</Text>
				</View>
			)}
		</Container>
	);
}
