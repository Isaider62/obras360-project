import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Button,
	Card,
	Input,
	Spinner,
	Switch,
	TextArea,
	useThemeColor,
} from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { api } from "@/lib/api";
import { useWeather } from "@/lib/weather";

export default function DiarioScreen() {
	const { id: obraId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const themeColorMuted = useThemeColor("muted");
	const themeColor = useThemeColor("foreground");

	const [activities, setActivities] = useState("");
	const [problems, setProblems] = useState("");
	const [notes, setNotes] = useState("");
	const [progressPct, setProgressPct] = useState("");
	const [weatherAuto, setWeatherAuto] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const {
		weather,
		loading: weatherLoading,
		fetchWeather,
	} = useWeather(-23.5505, -46.6333); // TODO: usar location da obra

	useEffect(() => {
		if (weatherAuto) {
			fetchWeather();
		}
	}, [weatherAuto]);

	const handleSubmit = async () => {
		const pct = progressPct ? Number.parseFloat(progressPct) : undefined;
		if (pct !== undefined && (pct < 0 || pct > 100)) {
			setError("Progresso deve ser entre 0 e 100");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const weatherData =
				weatherAuto && weather
					? {
							temperature: weather.temperature,
							humidity: weather.humidity,
							weatherCode: weather.weatherCode,
							description: weather.description,
						}
					: undefined;

			await api.diarios.create({
				obraId: obraId || "",
				activities: activities.trim() || undefined,
				problems: problems.trim() || undefined,
				notes: notes.trim() || undefined,
				progressPct: pct,
				weather: weatherData,
			});
			setSaved(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao salvar");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="flex-1">
			<ScrollView>
				<View className="mb-6 flex-row items-center justify-between">
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={themeColor} />
					</Pressable>
					<Text className="font-bold text-xl">Diário de Obra</Text>
					<View style={{ width: 24 }} />
				</View>

				<Text
					className="mb-4 text-center text-base"
					style={{ color: themeColorMuted }}
				>
					{new Date().toLocaleDateString("pt-BR", {
						weekday: "long",
						day: "numeric",
						month: "long",
					})}
				</Text>

				{error && (
					<Card variant="bordered" className="mb-4 border-danger p-3">
						<Text className="text-danger text-sm">{error}</Text>
					</Card>
				)}

				{saved && (
					<Card variant="bordered" className="mb-4 border-success p-3">
						<View className="flex-row items-center">
							<Ionicons name="checkmark-circle" size={20} color="success" />
							<Text className="ml-2 text-success">
								Diário salvo com sucesso!
							</Text>
						</View>
					</Card>
				)}

				<TextArea
					label="Atividades do Dia"
					value={activities}
					onChangeText={setActivities}
					placeholder="O que foi feito hoje..."
					numberOfLines={4}
					className="mb-4"
				/>

				<TextArea
					label="Problemas / Ocorrências"
					value={problems}
					onChangeText={setProblems}
					placeholder="Problemas enfrentados..."
					numberOfLines={3}
					className="mb-4"
				/>

				<TextArea
					label="Observações"
					value={notes}
					onChangeText={setNotes}
					placeholder="Notas adicionais..."
					numberOfLines={3}
					className="mb-4"
				/>

				<Input
					label="Avanço (%)"
					value={progressPct}
					onChangeText={setProgressPct}
					placeholder="0-100"
					keyboardType="numeric"
					className="mb-4"
				/>

				<Card variant="bordered" className="mb-4 p-4">
					<View className="flex-row items-center justify-between">
						<View className="flex-1">
							<Text className="font-semibold">Clima Automático</Text>
							<Text style={{ color: themeColorMuted }} className="text-sm">
								Buscar clima atual via Open-Meteo
							</Text>
						</View>
						<Switch value={weatherAuto} onValueChange={setWeatherAuto} />
					</View>
					{weather && weatherAuto && (
						<View className="mt-3 flex-row items-center">
							<Ionicons
								name={weather.icon as any}
								size={24}
								color={themeColor}
							/>
							<Text className="ml-2">
								{Math.round(weather.temperature)}° - {weather.description}
							</Text>
						</View>
					)}
				</Card>

				<Button
					variant="solid"
					className="w-full"
					onPress={handleSubmit}
					disabled={loading}
				>
					{loading ? <Spinner size="sm" /> : "Salvar Diário"}
				</Button>
			</ScrollView>
		</Container>
	);
}
