import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Input, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { api } from "@/lib/api";

type StatusObra = "PLANEJAMENTO" | "EM_ANDAMENTO";

const STATUS_OPTIONS: { value: StatusObra; label: string }[] = [
	{ value: "PLANEJAMENTO", label: "Planejamento" },
	{ value: "EM_ANDAMENTO", label: "Em Andamento" },
];

export default function NovaObraScreen() {
	const router = useRouter();
	const themeColorMuted = useThemeColor("muted");
	const themeColor = useThemeColor("foreground");

	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [budgetTotal, setBudgetTotal] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [status, setStatus] = useState<StatusObra>("PLANEJAMENTO");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError("Nome é obrigatório");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			await api.obras.create({
				name: name.trim(),
				address: address.trim() || undefined,
				status,
				budgetTotal: budgetTotal ? Number.parseFloat(budgetTotal) : undefined,
				startDate: startDate ? new Date(startDate).toISOString() : undefined,
				endDate: endDate ? new Date(endDate).toISOString() : undefined,
			});
			router.back();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao criar obra");
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
					<Text className="font-bold text-xl">Nova Obra</Text>
					<View style={{ width: 24 }} />
				</View>

				{error && (
					<Card variant="bordered" className="mb-4 border-danger p-3">
						<Text className="text-danger text-sm">{error}</Text>
					</Card>
				)}

				<Input
					label="Nome da Obra *"
					value={name}
					onChangeText={setName}
					placeholder="Ex: Residencial Parque Verde"
					className="mb-4"
				/>

				<Input
					label="Endereço"
					value={address}
					onChangeText={setAddress}
					placeholder="Rua das Flores, 123"
					className="mb-4"
				/>

				<Input
					label="Orçamento Total (R$)"
					value={budgetTotal}
					onChangeText={setBudgetTotal}
					placeholder="150000"
					keyboardType="numeric"
					className="mb-4"
				/>

				<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
					Status Inicial
				</Text>
				<View className="mb-4 flex-row gap-2">
					{STATUS_OPTIONS.map((option) => (
						<Button
							key={option.value}
							variant={status === option.value ? "solid" : "light"}
							size="sm"
							onPress={() => setStatus(option.value)}
						>
							{option.label}
						</Button>
					))}
				</View>

				<Text className="mb-2 text-sm" style={{ color: themeColorMuted }}>
					Datas
				</Text>
				<View className="mb-6 flex-row gap-2">
					<Input
						label="Início"
						value={startDate}
						onChangeText={setStartDate}
						placeholder="YYYY-MM-DD"
						className="flex-1"
					/>
					<Input
						label="Previsão Fim"
						value={endDate}
						onChangeText={setEndDate}
						placeholder="YYYY-MM-DD"
						className="flex-1"
					/>
				</View>

				<Button
					variant="solid"
					className="w-full"
					onPress={handleSubmit}
					disabled={loading}
				>
					{loading ? <Spinner size="sm" /> : "Criar Obra"}
				</Button>
			</ScrollView>
		</Container>
	);
}
