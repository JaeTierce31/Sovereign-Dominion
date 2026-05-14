export interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipMm: number;
  windMph: number;
  conditions: string;
  isBuildable: boolean;
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherDay[]> {
  const workerUrl = import.meta.env.VITE_WEATHER_WORKER_URL;
  const res = await fetch(`${workerUrl}/?lat=${lat}&lng=${lng}`);
  const data = await res.json();

  const days = data.days || [];
  return days.map((d: any): WeatherDay => ({
    date: d.datetime,
    tempMax: d.tempmax,
    tempMin: d.tempmin,
    precipMm: (d.precip ?? 0) * 25.4,
    windMph: d.windspeed,
    conditions: d.conditions,
    isBuildable: isBuildableDay(d),
  }));
}

function isBuildableDay(d: any): boolean {
  if ((d.precip ?? 0) > 0.25) return false;
  if ((d.windspeed ?? 0) > 25) return false;
  if (d.tempmax < 32 || d.tempmin < 20) return false;
  return true;
}
