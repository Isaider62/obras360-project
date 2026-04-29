import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Badge,
	Button,
	Spinner,
	useThemeColor,
	useThemeColor as useUiThemeColor,
} from "heroui-native";
import { useEffect, useMemo, useState } from "react";
import {
	Dimensions,
	FlatList,
	Image,
	Pressable,
	Text,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { api } from "@/lib/api";
import { useOffline } from "@/presentation/hooks/useOffline";

const ETAPA_COLORS: Record<
	string,
	"primary" | "secondary" | "success" | "warning" | "default"
> = {
	FUNDACAO: "secondary",
	ESTRUTURA: "primary",
	ALVENARIA: "warning",
	INSTALACOES: "warning",
	ACABAMENTO: "success",
};

type DateFilter = "TODAS" | "HOJE" | "SEMANA" | "MES";

type EtapaFilter =
	| "TODAS"
	| "FUNDACAO"
	| "ESTRUTURA"
	| "ALVENARIA"
	| "INSTALACOES"
	| "ACABAMENTO";

export default function FotosScreen() {
	const { obraId } = useLocalSearchParams<{ obraId: string }>();
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");
	const { isOnline } = useOffline();

	const [fotos, setFotos] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [etapa, setEtapa] = useState<EtapaFilter>("TODAS");
	const [dateFilter, setDateFilter] = useState<DateFilter>("TODAS");
	const [classificando, setClassificando] = useState(false);
	const [selectedFoto, setSelectedFoto] = useState<any | null>(null);

	const loadFotos = async () => {
		try {
			setLoading(true);
			const result = await api.media.listFotos({ obraId: obraId || "" });
			setFotos(result);
		} catch (e) {
			console.error("Erro ao carregar fotos:", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadFotos();
	}, [obraId]);

	const filteredFotos = useMemo(() => {
		let result = [...fotos];

		if (etapa !== "TODAS") {
			result = result.filter((f) => f.stageIa === etapa);
		}

		if (dateFilter !== "TODAS") {
			const now = new Date();
			result = result.filter((f) => {
				const fotoDate = new Date(f.capturedAt);
				if (dateFilter === "HOJE") {
					return fotoDate.toDateString() === now.toDateString();
				}
				if (dateFilter === "SEMANA") {
					const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					return fotoDate >= weekAgo;
				}
				if (dateFilter === "MES") {
					const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					return fotoDate >= monthAgo;
				}
				return true;
			});
		}

		return result;
	}, [fotos, etapa, dateFilter]);

	const handleClassificar = async (foto: any) => {
		if (!isOnline) return;
		setClassificando(true);
		try {
			const result = await api.ai.classificarFoto({ imageUrl: foto.url });
			setFotos((prev) =>
				prev.map((f) =>
					f.id === foto.id
						? { ...f, stageIa: result.etapa, tagsIa: result.tags }
						: f,
				),
			);
		} catch (e) {
			console.error("Erro ao classificar:", e);
		} finally {
			setClassificando(false);
		}
	};

	const renderFoto = ({ item }: { item: any }) => {
		const etapaColor = ETAPA_COLORS[item.stageIa || ""] || "default";

		return (
			<Pressable
				onPress={() => setSelectedFoto(item)}
				style={{
					width: ITEM_WIDTH,
					height: ITEM_WIDTH,
					margin: ITEM_SPACING / 2,
				}}
			>
				<Image
					source={{ uri: item.url }}
					style={{ width: "100%", height: "100%", borderRadius: 8 }}
					resizeMode="cover"
				/>
				{item.stageIa && (
					<Badge
						color={etapaColor}
						variant="solid"
						size="sm"
						className="absolute right-1 bottom-1"
					>
						{item.stageIa}
					</Badge>
				)}
			</Pressable>
		);
	};

	if (selectedFoto) {
		return (
			<Container className="flex-1 bg-black">
				<View className="absolute top-12 right-0 left-0 z-10 flex-row items-center justify-between px-4">
					<Pressable
						onPress={() => setSelectedFoto(null)}
						className="rounded-full bg-black/50 p-2"
					>
						<Ionicons name="close" size={24} color="white" />
					</Pressable>
				</View>
				<Image
					source={{ uri: selectedFoto.url }}
					style={{ flex: 1, resizeMode: "contain" }}
				/>
				<View className="absolute right-4 bottom-12 left-4 rounded-lg bg-black/70 p-3">
					<Text className="font-semibold text-white">{selectedFoto.title}</Text>
					{selectedFoto.stageIa && (
						<Badge
							color={ETAPA_COLORS[selectedFoto.stageIa] || "default"}
							variant="solid"
							className="mt-2"
						>
							{selectedFoto.stageIa}
						</Badge>
					)}
					{selectedFoto.tagsIa && selectedFoto.tagsIa.length > 0 && (
						<View className="mt-2 flex-row flex-wrap gap-1">
							{selectedFoto.tagsIa.map((tag: string, i: number) => (
								<Badge key={i} variant="outline" size="sm">
									{tag}
								</Badge>
							))}
						</View>
					)}
					<Text className="mt-2 text-gray-300 text-sm">
						{new Date(selectedFoto.capturedAt).toLocaleString("pt-BR")}
					</Text>
					{isOnline && !selectedFoto.stageIa && (
						<Button
							variant="solid"
							size="sm"
							className="mt-3"
							onPress={() => handleClassificar(selectedFoto)}
							disabled={classificando}
						>
							{classificando ? <Spinner size="sm" /> : "Classificar com IA"}
						</Button>
					)}
				</View>
			</Container>
		);
	}

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center justify-between">
				<Pressable onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color={themeColor} />
				</Pressable>
				<Text className="font-bold text-xl">Fotos</Text>
				<Pressable onPress={() => router.push(`/obras/${obraId}/camera`)}>
					<Ionicons name="camera" size={24} color={themeColor} />
				</Pressable>
			</View>

			<View className="mb-3 flex-row gap-1 overflow-x-auto">
				{(
					[
						"TODAS",
						"FUNDACAO",
						"ESTRUTURA",
						"ALVENARIA",
						"INSTALACOES",
						"ACABAMENTO",
					] as const
				).map((e) => (
					<Button
						key={e}
						variant={etapa === e ? "solid" : "light"}
						size="sm"
						onPress={() => setEtapa(e)}
					>
						{e}
					</Button>
				))}
			</View>

			<View className="mb-3 flex-row gap-1 overflow-x-auto">
				{(["TODAS", "HOJE", "SEMANA", "MES"] as const).map((d) => (
					<Button
						key={d}
						variant={dateFilter === d ? "solid" : "light"}
						size="sm"
						color={dateFilter === d ? "primary" : "default"}
						onPress={() => setDateFilter(d)}
					>
						{d}
					</Button>
				))}
			</View>

			{!isOnline && (
				<View className="mb-3 flex-row items-center gap-2 rounded bg-warning/20 p-2">
					<Ionicons name="cloud-offline" size={16} />
					<Text className="text-sm">Modo offline</Text>
				</View>
			)}

			<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
				{filteredFotos.length} foto{filteredFotos.length !== 1 ? "s" : ""}
			</Text>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : filteredFotos.length === 0 ? (
				<View className="flex-1 items-center justify-center">
					<Ionicons
						name="images-outline"
						size={48}
						style={{ color: themeColorMuted }}
					/>
					<Text className="mt-4" style={{ color: themeColorMuted }}>
						Nenhuma foto encontrada
					</Text>
					<Button
						variant="light"
						className="mt-4"
						onPress={() => router.push(`/obras/${obraId}/camera`)}
					>
						<Text>Tirar foto</Text>
					</Button>
				</View>
			) : (
				<FlatList
					data={filteredFotos}
					renderItem={renderFoto}
					keyExtractor={(item) => item.id}
					numColumns={COLUMN_COUNT}
					contentContainerStyle={{
						paddingHorizontal: 8,
						paddingBottom: 100,
					}}
				/>
			)}
		</Container>
	);
}
