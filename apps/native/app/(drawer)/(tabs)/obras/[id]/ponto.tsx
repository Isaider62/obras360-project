import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Spinner, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { api } from "@/lib/api";
import { SignaturePad } from "@/presentation/components/SignaturePad";
import type { RegistroPonto } from "~/domain/entities";

export default function PontoScreen() {
	const { id: obraId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const themeColorMuted = useThemeColor("muted");
	const themeColor = useThemeColor("foreground");

	const [loading, setLoading] = useState(true);
	const [registering, setRegistering] = useState(false);
	const [showSignature, setShowSignature] = useState(false);
	const [pendingType, setPendingType] = useState<"entrada" | "saida" | null>(
		null,
	);
	const [signature, setSignature] = useState<string | null>(null);
	const [ponto, setPonto] = useState<RegistroPonto | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadPonto();
	}, []);

	const loadPonto = async () => {
		try {
			setLoading(true);
			const today = new Date().toISOString().split("T")[0];
			const result = await api.ponto.get({
				obraId: obraId || "",
				date: today,
			});
			setPonto(result);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = (type: "entrada" | "saida") => {
		setPendingType(type);
		setShowSignature(true);
	};

	const handleConfirmSignature = async () => {
		if (!pendingType || !signature) return;

		setRegistering(true);
		setError(null);

		try {
			const now = new Date().toISOString();
			const result = await api.ponto.register({
				obraId: obraId || "",
				entryTime: pendingType === "entrada" ? now : undefined,
				exitTime: pendingType === "saida" ? now : undefined,
				signatureUrl: signature,
			});
			setPonto(result);
			setShowSignature(false);
			setPendingType(null);
			setSignature(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao registrar");
		} finally {
			setRegistering(false);
		}
	};

	const handleCancelSignature = () => {
		setShowSignature(false);
		setPendingType(null);
		setSignature(null);
	};

	const hasEntry = ponto?.entryTime;
	const hasExit = ponto?.exitTime;

	return (
		<Container className="flex-1">
			<ScrollView>
				<View className="mb-6 flex-row items-center justify-between">
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={themeColor} />
					</Pressable>
					<Text className="font-bold text-xl">Ponto</Text>
					<View style={{ width: 24 }} />
				</View>

				<Text className="mb-2 text-center text-lg">
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

				{showSignature && (
					<View className="mb-4 rounded-lg bg-default-100 p-4">
						<Text className="mb-4 text-center font-semibold text-lg">
							Assinatura para {pendingType === "entrada" ? "entrada" : "saída"}
						</Text>
						<SignaturePad
							onOK={(sig) => setSignature(sig)}
							onEmpty={() => setError("Por favor, assine antes de continuar")}
						/>
						<View className="mt-4 flex-row gap-2">
							<Button
								variant="light"
								className="flex-1"
								onPress={handleCancelSignature}
							>
								Cancelar
							</Button>
							<Button
								variant="solid"
								className="flex-1"
								onPress={handleConfirmSignature}
								disabled={!signature || registering}
							>
								{registering ? <Spinner size="sm" /> : "Confirmar"}
							</Button>
						</View>
					</View>
				)}

				{loading ? (
					<View className="items-center justify-center py-12">
						<Spinner size="lg" />
					</View>
				) : (
					<View className="py-4">
						<Card variant="bordered" className="mb-6 p-6">
							<View className="flex-row justify-around">
								<View className="items-center">
									<View
										className={`h-20 w-20 items-center justify-center rounded-full ${
											hasEntry ? "bg-success" : "bg-default-200"
										}`}
									>
										<Ionicons
											name="log-in"
											size={32}
											color={hasEntry ? "#fff" : themeColorMuted}
										/>
									</View>
									<Text className="mt-2 font-semibold">Entrada</Text>
									<Text style={{ color: themeColorMuted }}>
										{hasEntry
											? new Date(hasEntry).toLocaleTimeString("pt-BR", {
													hour: "2-digit",
													minute: "2-digit",
												})
											: "--:--"}
									</Text>
								</View>

								<View className="items-center">
									<View
										className={`h-20 w-20 items-center justify-center rounded-full ${
											hasExit ? "bg-danger" : "bg-default-200"
										}`}
									>
										<Ionicons
											name="log-out"
											size={32}
											color={hasExit ? "#fff" : themeColorMuted}
										/>
									</View>
									<Text className="mt-2 font-semibold">Saída</Text>
									<Text style={{ color: themeColorMuted }}>
										{hasExit
											? new Date(hasExit).toLocaleTimeString("pt-BR", {
													hour: "2-digit",
													minute: "2-digit",
												})
											: "--:--"}
									</Text>
								</View>
							</View>
						</Card>

						{!hasEntry ? (
							<Button
								variant="solid"
								className="mb-3 w-full"
								onPress={() => handleRegister("entrada")}
								disabled={registering}
							>
								{registering ? (
									<Spinner size="sm" />
								) : (
									<>
										<Ionicons name="log-in" size={20} />
										<Text className="ml-2">Registrar Entrada</Text>
									</>
								)}
							</Button>
						) : !hasExit ? (
							<Button
								variant="solid"
								color="danger"
								className="mb-3 w-full"
								onPress={() => handleRegister("saida")}
								disabled={registering}
							>
								{registering ? (
									<Spinner size="sm" />
								) : (
									<>
										<Ionicons name="log-out" size={20} />
										<Text className="ml-2">Registrar Saída</Text>
									</>
								)}
							</Button>
						) : (
							<Card variant="bordered" className="p-4">
								<View className="flex-row items-center">
									<Ionicons name="checkmark-circle" size={24} color="success" />
									<Text className="ml-2">Ponto registrado com sucesso!</Text>
								</View>
							</Card>
						)}
					</View>
				)}
			</ScrollView>
		</Container>
	);
}
