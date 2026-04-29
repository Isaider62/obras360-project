import { useState } from "react";

export interface WeatherData {
	temperature: number;
	humidity: number;
	weatherCode: number;
	description: string;
	icon: string;
}

export function useWeather(latitude: number, longitude: number) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [weather, setWeather] = useState<WeatherData | null>(null);

	const fetchWeather = async () => {
		setLoading(true);
		setError(null);

		try {
			const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code`;

			const res = await fetch(url);
			if (!res.ok) throw new Error("Erro ao buscar clima");

			const data = await res.json();
			const current = data.current;

			setWeather({
				temperature: current.temperature_2m,
				humidity: current.relative_humidity_2m,
				weatherCode: current.weather_code,
				description: getWeatherDescription(current.weather_code),
				icon: getWeatherIcon(current.weather_code),
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao buscar clima");
		} finally {
			setLoading(false);
		}
	};

	return { weather, loading, error, fetchWeather };
}

function getWeatherDescription(code: number): string {
	const map: Record<number, string> = {
		0: "Céu limpo",
		1: "Principalmente limpo",
		2: "Parcialmente nublado",
		3: "Nublado",
		45: "Nevoeiro",
		48: "Nevoeiro",
		51: "Garoa leve",
		53: "Garoa moderada",
		55: "Garoa intensa",
		61: "Chuva leve",
		63: "Chuva moderada",
		65: "Chuva intensa",
		71: "Neve leve",
		73: "Neve moderada",
		75: "Neve intensa",
		80: "Pancadas de chuva",
		95: "Tempestade",
		96: "Tempestade com granizo",
		99: "Tempestade com granizo",
	};
	return map[code] || "Desconhecido";
}

function getWeatherIcon(code: number): string {
	if (code === 0 || code === 1) return "sunny";
	if (code === 2 || code === 3) return "cloudy";
	if (code >= 45 && code <= 48) return "cloudy";
	if (code >= 51 && code <= 55) return "rainy";
	if (code >= 61 && code <= 65) return "rainy";
	if (code >= 71 && code <= 75) return "snow";
	if (code >= 80) return "thunderstorm";
	return "cloudy";
}
