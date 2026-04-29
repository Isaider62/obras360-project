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
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { api } from "@/lib/api";
import { pickFotos, takeFoto, uploadFotos } from "@/lib/foto";
import { useVoz } from "@/lib/voz";
import type { Urgency } from "~/domain/entities";

type UrgencyOption = {
	value: Urgency;
	label: string;
	color: "success" | "warning" | "danger";
};

const URGENCY_OPTIONS: UrgencyOption[] = [
	{ value: "NORMAL", label: "Normal", color: "success" },
	{ value: "URGENTE", label: "Urgente", color: "warning" },
	{ value: "CRITICAL", label: "Crítico", color: "danger" },
];

const UNIT_OPTIONS = ["un", "sacos", "kg", "litros", "m³", "barras", "metros"];

export default function NovaSolicitacaoScreen() {
	const { obraId } = useLocalSearchParams<{ obraId: string }>();
	const router = useRouter();
	const themeColorMuted = useThemeColor("muted");
	const themeColor = useThemeColor("foreground");

	const [item, setItem] = useState("");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState("un");
	const [urgency, setUrgency] = useState<Urgency>("NORMAL");
	const [observation, setObservation] = useState("");
	const [fotos, setFotos] = useState<
		{ uri: string; name: string; type: string }[]
	>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [voiceRecording, setVoiceRecording] = useState<{
		uri: string;
		duration: number;
	} | null>(null);

	const {
		startRecording,
		stopRecording,
		playRecording,
		stopPlaying,
		isRecording,
		playing,
	} = useVoz();

	const handleAddFotos = async () => {
		try {
			const novas = await pickFotos();
			setFotos((prev) => [...prev, ...novas]);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao selecionar fotos");
		}
	};

	const handleTakeFoto = async () => {
		try {
			const foto = await takeFoto();
			if (foto) {
				setFotos((prev) => [...prev, foto]);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao tirar foto");
		}
	};

	const handleRemoveFoto = (uri: string) => {
		setFotos((prev) => prev.filter((f) => f.uri !== uri));
	};

	const handleStartVoice = async () => {
		try {
			await startRecording();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao iniciar gravação");
		}
	};

	const handleStopVoice = async () => {
		try {
			const result = await stopRecording();
			if (result) {
				setVoiceRecording({ uri: result.uri, duration: result.duration });
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao parar gravação");
		}
	};

	const handlePlayVoice = async () => {
		if (!voiceRecording) return;
		try {
			if (playing) {
				await stopPlaying();
			} else {
				await playRecording(voiceRecording.uri);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao reproduzir");
		}
	};

	const handleRemoveVoice = () => {
		setVoiceRecording(null);
	};

	const handleSubmit = async () => {
		if (!item.trim()) {
			setError("Item é obrigatório");
			return;
		}
		if (!quantity || Number.parseFloat(quantity) <= 0) {
			setError("Quantidade inválida");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			let fotoUrls: string[] = [];

			if (fotos.length > 0) {
				const uploadResult = await uploadFotos(obraId || "", fotos);
				if (!uploadResult.success) {
					setError(`Erro ao enviar fotos: ${uploadResult.errors.join(", ")}`);
					setLoading(false);
					return;
				}
				fotoUrls = uploadResult.urls;
			}

			await api.solicitacoes.create({
				obraId: obraId || "",
				item: item.trim(),
				quantity: Number.parseFloat(quantity),
				unit,
				urgency,
				observation: observation.trim() || undefined,
				fotos: fotoUrls.length > 0 ? fotoUrls : undefined,
			});
			router.back();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao criar solicitação");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="flex-1">
			<ScrollView>
				<View className="mb-6 flex-row items-center justify-between">
					<Pressable onPress={() => router.back()}>
						<Ionicons name="close" size={24} color={themeColor} />
					</Pressable>
					<Text className="font-bold text-xl">Nova Solicitação</Text>
					<View style={{ width: 24 }} />
				</View>

				{error && (
					<Card variant="bordered" className="mb-4 border-danger p-3">
						<Text className="text-danger text-sm">{error}</Text>
					</Card>
				)}

				<Input
					label="Item *"
					value={item}
					onChangeText={setItem}
					placeholder="Ex: Cimento CPII, Areia, Tijolos..."
					className="mb-4"
				/>

				<View className="mb-4 flex-row gap-3">
					<Input
						label="Quantidade *"
						value={quantity}
						onChangeText={setQuantity}
						placeholder="50"
						keyboardType="numeric"
						className="flex-1"
					/>
					<View className="flex-1">
						<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
							Unidade
						</Text>
						<View className="flex-row flex-wrap gap-2">
							{UNIT_OPTIONS.map((u) => (
								<Button
									key={u}
									variant={unit === u ? "solid" : "light"}
									size="sm"
									onPress={() => setUnit(u)}
								>
									{u}
								</Button>
							))}
						</View>
					</View>
				</View>

				<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
					Urgência
				</Text>
				<View className="mb-4 flex-row gap-2">
					{URGENCY_OPTIONS.map((option) => (
						<Button
							key={option.value}
							variant={urgency === option.value ? "solid" : "light"}
							color={option.color}
							size="sm"
							onPress={() => setUrgency(option.value)}
						>
							{option.label}
						</Button>
					))}
				</View>

				<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
					Fotos (opcional)
				</Text>
				<View className="mb-4 flex-row flex-wrap gap-2">
					{fotos.map((foto) => (
						<View key={foto.uri} className="relative">
							<Image
								source={{ uri: foto.uri }}
								className="h-20 w-20 rounded-lg"
								resizeMode="cover"
							/>
							<Pressable
								className="absolute -top-2 -right-2 rounded-full bg-danger p-1"
								onPress={() => handleRemoveFoto(foto.uri)}
							>
								<Ionicons name="close" size={12} color="white" />
							</Pressable>
						</View>
					))}
					<Pressable
						className="h-20 w-20 items-center justify-center rounded-lg border-2 border-muted border-dashed"
						onPress={handleAddFotos}
					>
						<Ionicons name="add" size={24} color={themeColorMuted} />
					</Pressable>
					<Pressable
						className="h-20 w-20 items-center justify-center rounded-lg border-2 border-muted border-dashed"
						onPress={handleTakeFoto}
					>
						<Ionicons name="camera" size={24} color={themeColorMuted} />
					</Pressable>
				</View>

				<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
					Áudio (opcional)
				</Text>
				<View className="mb-4 flex-row items-center gap-3">
					{voiceRecording ? (
						<View className="flex-1 flex-row items-center gap-2 rounded-lg bg-default/10 p-3">
							<Ionicons name="musical-notes" size={24} />
							<Text className="flex-1">
								{Math.round(voiceRecording.duration / 1000)}s
							</Text>
							<Pressable onPress={handlePlayVoice}>
								<Ionicons
									name={playing ? "pause" : "play"}
									size={24}
									color={themeColor}
								/>
							</Pressable>
							<Pressable onPress={handleRemoveVoice}>
								<Ionicons name="trash" size={20} color="danger" />
							</Pressable>
						</View>
					) : (
						<Pressable
							className={`h-12 flex-1 items-center justify-center rounded-lg border-2 ${
								isRecording ? "border-danger" : "border-muted border-dashed"
							}`}
							onPress={isRecording ? handleStopVoice : handleStartVoice}
						>
							<Ionicons
								name={isRecording ? "stop" : "mic"}
								size={24}
								color={isRecording ? "danger" : themeColorMuted}
							/>
							<Text className="ml-2 text-sm" style={{ color: themeColorMuted }}>
								{isRecording ? "Parar" : "Gravar voz"}
							</Text>
						</Pressable>
					)}
				</View>

				<TextArea
					label="Observação"
					value={observation}
					onChangeText={setObservation}
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
					{loading ? <Spinner size="sm" /> : "Enviar Solicitação"}
				</Button>
			</ScrollView>
		</Container>
	);
}
