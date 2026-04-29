import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useCallback, useRef, useState } from "react";

export interface RecordingResult {
	uri: string;
	duration: number;
}

export function useVoz() {
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [playing, setPlaying] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const soundRef = useRef<Audio.Sound | null>(null);

	const startRecording = useCallback(async () => {
		try {
			await Audio.requestPermissionsAsync();
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});

			const { recording } = await Audio.Recording.createAsync(
				Audio.RecordingOptionsPresets.HIGH_QUALITY,
			);
			setRecording(recording);
			setIsRecording(true);
		} catch (error) {
			console.error("Erro ao iniciar gravação:", error);
			throw error;
		}
	}, []);

	const stopRecording =
		useCallback(async (): Promise<RecordingResult | null> => {
			if (!recording) return null;

			try {
				setIsRecording(false);
				await recording.stopAndUnloadAsync();
				const uri = recording.getURI();
				const status = await recording.getStatusAsync();
				setRecording(null);

				if (uri) {
					const duration = status.durationMillis || 0;
					return { uri, duration };
				}
				return null;
			} catch (error) {
				console.error("Erro ao parar gravação:", error);
				throw error;
			}
		}, [recording]);

	const playRecording = useCallback(async (uri: string) => {
		try {
			if (soundRef.current) {
				await soundRef.current.unloadAsync();
			}

			const { sound } = await Audio.Sound.createAsync({ uri });
			soundRef.current = sound;
			setPlaying(true);

			sound.setOnPlaybackStatusUpdate((status) => {
				if (status.isLoaded && status.didJustFinish) {
					setPlaying(false);
				}
			});

			await sound.playAsync();
		} catch (error) {
			console.error("Erro ao reproduzir:", error);
			throw error;
		}
	}, []);

	const stopPlaying = useCallback(async () => {
		try {
			if (soundRef.current) {
				await soundRef.current.stopAsync();
				setPlaying(false);
			}
		} catch (error) {
			console.error("Erro ao parar reprodução:", error);
		}
	}, []);

	const saveRecordingLocally = useCallback(
		async (uri: string, obraId: string): Promise<string> => {
			const filename = `voz_${obraId}_${Date.now()}.m4a`;
			const newUri = `${FileSystem.documentDirectory}${filename}`;

			await FileSystem.copyAsync({
				from: uri,
				to: newUri,
			});

			return newUri;
		},
		[],
	);

	return {
		startRecording,
		stopRecording,
		playRecording,
		stopPlaying,
		saveRecordingLocally,
		isRecording,
		playing,
		duration,
	};
}
