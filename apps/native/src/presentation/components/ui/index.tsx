import { type ButtonProps, Button as HeroButton } from "heroui-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export type { ButtonProps };

interface ExtendedButtonProps extends ButtonProps {
	loading?: boolean;
}

export function Button({
	children,
	loading,
	disabled,
	...props
}: ExtendedButtonProps) {
	return (
		<HeroButton disabled={disabled || loading} {...props}>
			{loading ? <ActivityIndicator size="small" color="white" /> : children}
		</HeroButton>
	);
}

export function Card({
	children,
	className,
	...props
}: { children: React.ReactNode; className?: string } & Record<
	string,
	unknown
>) {
	return <View className={className}>{children}</View>;
}

export function Spinner({ size = "large" }: { size?: "small" | "large" }) {
	return <ActivityIndicator size={size} />;
}

export function Loader({ text }: { text?: string }) {
	return (
		<View className="flex-1 items-center justify-center">
			<ActivityIndicator size="large" />
			{text && <Text className="mt-2 text-muted">{text}</Text>}
		</View>
	);
}

export function EmptyState({
	title,
	subtitle,
	action,
}: {
	title: string;
	subtitle?: string;
	action?: React.ReactNode;
}) {
	return (
		<View className="flex-1 items-center justify-center p-8">
			<Text className="text-center font-semibold text-foreground text-lg">
				{title}
			</Text>
			{subtitle && (
				<Text className="mt-2 text-center text-muted text-sm">{subtitle}</Text>
			)}
			{action && <View className="mt-4">{action}</View>}
		</View>
	);
}

export function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry?: () => void;
}) {
	return (
		<View className="flex-1 items-center justify-center p-8">
			<Text className="text-center text-danger">{message}</Text>
			{onRetry && (
				<Pressable onPress={onRetry} className="mt-4">
					<Text className="text-primary">Tentar novamente</Text>
				</Pressable>
			)}
		</View>
	);
}

export function Badge({
	children,
	variant = "default",
}: {
	children: React.ReactNode;
	variant?: "default" | "success" | "warning" | "danger";
}) {
	const colors = {
		default: "bg-muted",
		success: "bg-success",
		warning: "bg-warning",
		danger: "bg-danger",
	};

	return (
		<View className={`rounded-full px-2 py-1 ${colors[variant]}`}>
			<Text className="text-white text-xs">{children}</Text>
		</View>
	);
}
