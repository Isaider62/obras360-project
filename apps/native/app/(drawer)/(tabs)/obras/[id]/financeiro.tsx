import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Button,
	Card,
	Input,
	Pressable,
	Select,
	Spinner,
	Text,
	useThemeColor,
	View,
} from "heroui-native";
import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { api } from "@/lib/api";

interface Transacao {
	id: string;
	obraId: string;
	tipo: "RECEITA" | "DESPESA";
	categoria: string;
	descricao: string | null;
	valor: number;
	data: string;
	pago: boolean;
}

interface FluxoCaixaData {
	resumo: {
		totalReceitas: number;
		totalDespesas: number;
		saldo: number;
		receitasPagas: number;
		despesasPagas: number;
	};
	porCategoria: { categoria: string; receita: number; despesa: number }[];
	porPeriodo: { periodo: string; receita: number; despesa: number }[];
	projetado: {
		receitaPrevista: number;
		despesaPrevista: number;
		saldoPrevisto: number;
	};
}

const categorias = [
	"MATERIAL",
	"MÃO DE OBRA",
	"EQUIPAMENTO",
	"SERVIÇO",
	"ADMINISTRAÇÃO",
	"OUTROS",
	"RECEBIMENTO",
	"ADIANTAMENTO",
];

export default function FinanceiroScreen() {
	const { id: obraId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");

	const [data, setData] = useState<FluxoCaixaData | null>(null);
	const [transacoes, setTransacoes] = useState<Transacao[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
	const [categoria, setCategoria] = useState("MATERIAL");
	const [descricao, setDescricao] = useState("");
	const [valor, setValor] = useState("");
	const [saving, setSaving] = useState(false);

	const loadData = async () => {
		setLoading(true);
		try {
			const [fluxo, list] = await Promise.all([
				api.finance.fluxoCaixa({ obraId: obraId || "" }),
				api.finance.list({ obraId: obraId || "" }),
			]);
			setData(fluxo);
			setTransacoes(list);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (obraId) loadData();
	}, [obraId]);

	const handleSave = async () => {
		if (!valor || Number.parseFloat(valor) <= 0) return;
		setSaving(true);
		try {
			await api.finance.create({
				obraId: obraId || "",
				tipo,
				categoria,
				descricao: descricao.trim() || undefined,
				valor: Number.parseFloat(valor),
			});
			setShowForm(false);
			setDescricao("");
			setValor("");
			loadData();
		} finally {
			setSaving(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center justify-between">
				<Pressable onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color={themeColor} />
				</Pressable>
				<Text className="font-bold text-xl">Fluxo de Caixa</Text>
				<Pressable onPress={() => setShowForm(!showForm)}>
					<Ionicons
						name={showForm ? "close" : "add"}
						size={24}
						color={themeColor}
					/>
				</Pressable>
			</View>

			{showForm && (
				<Card variant="bordered" className="mb-4 p-4">
					<Text className="mb-3 font-semibold">Nova Transação</Text>
					<Select
						label="Tipo"
						selectedKey={tipo}
						onSelectionChange={(k) => setTipo(k as "RECEITA" | "DESPESA")}
						className="mb-3"
					>
						<Select.Item key="DESPESA">Despesa</Select.Item>
						<Select.Item key="RECEITA">Receita</Select.Item>
					</Select>
					<Select
						label="Categoria"
						selectedKey={categoria}
						onSelectionChange={(k) => setCategoria(k as string)}
						className="mb-3"
					>
						{categorias.map((c) => (
							<Select.Item key={c}>{c}</Select.Item>
						))}
					</Select>
					<Input
						label="Descrição"
						value={descricao}
						onChangeText={setDescricao}
						className="mb-3"
					/>
					<Input
						label="Valor (R$)"
						value={valor}
						onChangeText={setValor}
						keyboardType="numeric"
						className="mb-4"
					/>
					<Button variant="solid" onPress={handleSave} disabled={saving}>
						{saving ? <Spinner size="sm" /> : "Salvar"}
					</Button>
				</Card>
			)}

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
									Receitas
								</Text>
								<Text className="font-semibold text-success">
									{formatCurrency(data.resumo.totalReceitas)}
								</Text>
							</View>
							<View>
								<Text style={{ color: themeColorMuted }} className="text-sm">
									Despesas
								</Text>
								<Text className="font-semibold text-danger">
									{formatCurrency(data.resumo.totalDespesas)}
								</Text>
							</View>
						</View>
						<View className="mt-2 border-default-200 border-t pt-2">
							<Text style={{ color: themeColorMuted }} className="text-sm">
								Saldo
							</Text>
							<Text
								className={`font-bold text-xl ${
									data.resumo.saldo >= 0 ? "text-success" : "text-danger"
								}`}
							>
								{formatCurrency(data.resumo.saldo)}
							</Text>
						</View>
					</Card>

					<Card variant="bordered" className="mb-4 p-4">
						<Text className="mb-3 font-semibold">Por Categoria</Text>
						{data.porCategoria.map((cat) => (
							<View
								key={cat.categoria}
								className="flex-row justify-between py-2"
							>
								<Text>{cat.categoria}</Text>
								<Text className="text-danger">
									{formatCurrency(cat.despesa)}
								</Text>
							</View>
						))}
					</Card>

					<Card variant="bordered" className="p-4">
						<Text className="mb-3 font-semibold">Últimas transações</Text>
						{transacoes.slice(0, 5).map((t) => (
							<View key={t.id} className="flex-row justify-between py-2">
								<View className="flex-row items-center">
									<Ionicons
										name={t.tipo === "RECEITA" ? "arrow-down" : "arrow-up"}
										size={16}
										color={t.tipo === "RECEITA" ? "#10B981" : "#EF4444"}
									/>
									<Text className="ml-2">{t.categoria}</Text>
								</View>
								<Text
									className={
										t.tipo === "RECEITA" ? "text-success" : "text-danger"
									}
								>
									{formatCurrency(t.valor)}
								</Text>
							</View>
						))}
					</Card>
				</View>
			) : (
				<View />
			)}
		</Container>
	);
}
