import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Button,
	Card,
	Input,
	Spinner,
	TextArea,
	useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { syncQueue } from "@/infrastructure/sync/SyncQueue";
import { api } from "@/lib/api";
import { useOffline } from "@/presentation/hooks/useOffline";

const TYPE_OPTIONS = [
	{ value: "FALTA_MATERIAL", label: "Falta Material", icon: "cube-outline" },
	{ value: "ATRASO", label: "Atraso", icon: "time-outline" },
	{ value: "INTERFERENCIA", label: "Interferência", icon: "warning-outline" },
	{ value: "CUSTO", label: "Custo", icon: "cash-outline" },
	{ value: "PRAZO", label: "Prazo", icon: "calendar-outline" },
	{ value: "SINCRONIZACAO", label: "Sincronização", icon: "sync-outline" },
];

const SEVERITY_OPTIONS = [
	{ value: "INFO", label: "Info", color: "primary" as const },
	{ value: "WARNING", label: "Aviso", color: "warning" as const },
	{ value: "ALERT", label: "Alerta", color: "danger" as const },
	{ value: "CRITICAL", label: "Crítico", color: "danger" as const },
];

export default function NovoAlertaScreen() {
	const { obraId } = useLocalSearchParams<{ obraId: string }>();
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");
	const { isOnline } = useOffline();

	const [type, setType] = useState("FALTA_MATERIAL");
	const [severity, setSeverity] = useState("WARNING");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!title.trim()) {
			setError("Título é obrigatório");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			if (isOnline) {
				await api.alertas.create({
					obraId: obraId || "",
					type: type as any,
					severity: severity as any,
					title: title.trim(),
					description: description.trim() || undefined,
				});
			} else {
				await syncQueue.add({
					type: "ALERTA_CREATE",
					payload: {
						obraId,
						type,
						severity,
						title: title.trim(),
						description: description.trim() || undefined,
					},
				});
			}
			router.back();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao criar alerta");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="flex-1">
			<View className="mb-6 flex-row items-center justify-between">
				<Pressable onPress={() => router.back()}>
					<Ionicons name="close" size={24} color={themeColor} />
				</Pressable>
				<Text className="font-bold text-xl">Novo Alerta</Text>
				<View style={{ width: 24 }} />
			</View>

			{!isOnline && (
				<View className="mb-4 flex-row items-center gap-2 rounded bg-warning/20 p-2">
					<Ionicons name="cloud-offline" size={16} />
					<Text className="text-sm">
						Offline - alerta será sincronizado depois
					</Text>
				</View>
			)}

			{error && (
				<Card variant="bordered" className="mb-4 border-danger p-3">
					<Text className="text-danger text-sm">{error}</Text>
				</Card>
			)}

			<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
				Tipo de Alerta
			</Text>
			<View className="mb-4 flex-row flex-wrap gap-2">
				{TYPE_OPTIONS.map((opt) => (
					<Button
						key={opt.value}
						variant={type === opt.value ? "solid" : "light"}
						onPress={() => setType(opt.value)}
						className="flex-row gap-1"
					>
						<Ionicons name={opt.icon as any} size={16} />
						<Text>{opt.label}</Text>
					</Button>
				))}
			</View>

			<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
				Severidade
			</Text>
			<View className="mb-4 flex-row gap-2">
				{SEVERITY_OPTIONS.map((opt) => (
					<Button
						key={opt.value}
						variant={severity === opt.value ? "solid" : "light"}
						color={opt.color}
						size="sm"
						onPress={() => setSeverity(opt.value)}
					>
						{opt.label}
					</Button>
				))}
			</View>

			<Input
				label="Título *"
				value={title}
				onChangeText={setTitle}
				placeholder="Ex: Falta de cimento na obra"
				className="mb-4"
			/>

			<TextArea
				label="Descrição"
				value={description}
				onChangeText={setDescription}
				placeholder="Detalhes adicionais..."
				numberOfLines={4}
				className="mb-6"
			/>

			<Button
				variant="solid"
				className="w-full"
				onPress={handleSubmit}
				disabled={loading}
			>
				{loading ? <Spinner size="sm" /> : "Criar Alerta"}
			</Button>
		</Container>
	);
}
