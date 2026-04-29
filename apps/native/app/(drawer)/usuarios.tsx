import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

interface Usuario {
	id: string;
	name: string;
	email: string;
	perfil: string;
	ativo: boolean;
	createdAt: string;
	updatedAt: string;
}

const perfis = [
	{ value: "ENCARREGADO", label: "Encarregado" },
	{ value: "COMPRAS", label: "Compras" },
	{ value: "GESTAO", label: "Gestão" },
	{ value: "ADMIN", label: "Admin" },
];

export default function UsuariosScreen() {
	const router = useRouter();
	const themeColor = useThemeColor("foreground");
	const themeColorMuted = useThemeColor("muted");

	const [usuarios, setUsuarios] = useState<Usuario[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<Usuario | null>(null);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [perfil, setPerfil] = useState("ENCARREGADO");
	const [saving, setSaving] = useState(false);

	const loadUsuarios = async () => {
		setLoading(true);
		try {
			const data = await api.usuarios.list({});
			setUsuarios(data);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUsuarios();
	}, []);

	const handleSave = async () => {
		if (!name.trim() || !email.trim()) return;

		setSaving(true);
		try {
			if (editing) {
				await api.usuarios.update({
					id: editing.id,
					name: name.trim(),
					perfil: perfil as any,
				});
			} else {
				await api.usuarios.create({
					name: name.trim(),
					email: email.trim(),
					perfil: perfil as any,
				});
			}
			setShowForm(false);
			setEditing(null);
			setName("");
			setEmail("");
			setPerfil("ENCARREGADO");
			loadUsuarios();
		} finally {
			setSaving(false);
		}
	};

	const handleEdit = (u: Usuario) => {
		setEditing(u);
		setName(u.name);
		setPerfil(u.perfil);
		setShowForm(true);
	};

	const handleDelete = async (u: Usuario) => {
		await api.usuarios.delete({ id: u.id });
		loadUsuarios();
	};

	const getPerfilLabel = (p: string) =>
		perfis.find((f) => f.value === p)?.label || p;

	return (
		<Container className="flex-1">
			<View className="mb-4 flex-row items-center justify-between">
				<Text className="font-bold text-xl">Usuários</Text>
				<Pressable
					onPress={() => {
						setShowForm(!showForm);
						setEditing(null);
						setName("");
						setEmail("");
						setPerfil("ENCARREGADO");
					}}
				>
					<Ionicons
						name={showForm ? "close" : "add"}
						size={24}
						color={themeColor}
					/>
				</Pressable>
			</View>

			{showForm && (
				<Card variant="bordered" className="mb-4 p-4">
					<Text className="mb-4 font-semibold">
						{editing ? "Editar Usuário" : "Novo Usuário"}
					</Text>

					<Input
						label="Nome"
						value={name}
						onChangeText={setName}
						className="mb-3"
					/>

					{!editing && (
						<Input
							label="Email"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							className="mb-3"
						/>
					)}

					<Select
						label="Perfil"
						selectedKey={perfil}
						onSelectionChange={(k) => setPerfil(k as string)}
						className="mb-4"
					>
						{perfis.map((p) => (
							<Select.Item key={p.value}>{p.label}</Select.Item>
						))}
					</Select>

					<Button variant="solid" onPress={handleSave} disabled={saving}>
						{saving ? <Spinner size="sm" /> : "Salvar"}
					</Button>
				</Card>
			)}

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<Spinner size="lg" />
				</View>
			) : (
				<View>
					{usuarios.map((u) => (
						<Pressable key={u.id} onPress={() => handleEdit(u)}>
							<Card variant="bordered" className="mb-3 p-3">
								<View className="flex-row items-center justify-between">
									<View className="flex-1">
										<Text className="font-semibold">{u.name}</Text>
										<Text
											style={{ color: themeColorMuted }}
											className="text-sm"
										>
											{u.email}
										</Text>
										<View className="mt-1 flex-row">
											<Text
												className={`rounded px-2 py-0.5 text-xs ${
													u.ativo
														? "bg-success/20 text-success"
														: "bg-default-200"
												}`}
											>
												{getPerfilLabel(u.perfil)}
											</Text>
										</View>
									</View>
									<Pressable onPress={() => handleDelete(u)}>
										<Ionicons name="trash" size={20} color="danger" />
									</Pressable>
								</View>
							</Card>
						</Pressable>
					))}
				</View>
			)}
		</Container>
	);
}
