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

interface TimelineItem {
	id: string;
	type: "DIARIO" | "ALERTA" | "FOTO" | "PONTO";
	date: string;
	title: string;
	subtitle?: string;
}

const typeIcons: Record<string, string> = {
	DIARIO: "document-text",
	ALERTA: "warning",
	FOTO: "camera",
	PONTO: "time",
};

const typeColors: Record<string, string> = {
	DIARIO: "#3B82F6",
	ALERTA: "#EF4444",
	FOTO: "#10B981",
	PONTO: "#8B5CF6",
};

export default function TimelineScreen() {
	const { id: obraId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");

	const [items, setItems] = useState<TimelineItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (obraId) {
			api.obras
				.timeline({ obraId })
				.then(setItems)
				.finally(() => setLoading(false));
		}
	}, [obraId]);

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center">
				<Pressable onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color={themeColor} />
				</Pressable>
				<Text className="ml-3 font-bold text-xl">Linha do Tempo</Text>
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : items.length === 0 ? (
				<View className="flex-1 items-center justify-center">
					<Ionicons name="time-outline" size={48} color={themeColorMuted} />
					<Text style={{ color: themeColorMuted }} className="mt-2">
						Nenhum evento ainda
					</Text>
				</View>
			) : (
				<View className="relative">
					<View className="absolute top-0 bottom-0 left-4 w-0.5 bg-default-200" />

					{items.map((item, index) => (
						<View key={item.id} className="relative mb-4 flex-row">
							<View
								className="z-10 h-8 w-8 items-center justify-center rounded-full"
								style={{ backgroundColor: typeColors[item.type] + "20" }}
							>
								<Ionicons
									name={typeIcons[item.type] as any}
									size={16}
									color={typeColors[item.type]}
								/>
							</View>

							<Card variant="bordered" className="ml-3 flex-1 p-3">
								<View className="flex-row justify-between">
									<Text className="flex-1 font-semibold">{item.title}</Text>
									<Text style={{ color: themeColorMuted }} className="text-xs">
										{formatTime(item.date)}
									</Text>
								</View>
								<Text style={{ color: themeColorMuted }} className="text-sm">
									{formatDate(item.date)}
								</Text>
								{item.subtitle && (
									<Text
										className="mt-1 text-xs"
										style={{ color: typeColors[item.type] }}
									>
										{item.subtitle}
									</Text>
								)}
							</Card>
						</View>
					))}
				</View>
			)}
		</Container>
	);
}
