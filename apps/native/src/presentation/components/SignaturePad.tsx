import { useThemeColor } from "heroui-native";
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import SignatureScreen from "react-native-signature-canvas";

interface SignatureProps {
	onOK: (signature: string) => void;
	onEmpty?: () => void;
	onEnd?: () => void;
}

export function SignaturePad({ onOK, onEmpty, onEnd }: SignatureProps) {
	const signatureRef = useRef<SignatureScreen>(null);
	const themeColor = useThemeColor("background");

	const handleEnd = () => {
		signatureRef.current?.readSignature();
	};

	const handleOK = (signature: string) => {
		onOK(signature);
	};

	const handleClear = () => {
		signatureRef.current?.clearSignature();
	};

	const style = `.m-signature-pad {
		box-shadow: none;
		border: none;
	}
	.m-signature-pad--body {
		border: none;
	}
	body,html {
		background-color: ${themeColor};
	}
	.m-signature-pad--footer {
		display: none;
	}`;

	return (
		<View className="h-48 overflow-hidden rounded-lg border border-muted">
			<SignatureScreen
				ref={signatureRef}
				onEnd={handleEnd}
				onOK={handleOK}
				onEmpty={onEmpty}
				webStyle={style}
				backgroundColor={themeColor}
				penColor="#000000"
			/>
		</View>
	);
}
