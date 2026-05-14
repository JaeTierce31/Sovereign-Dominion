import { WeatherDay } from './weatherService';
import { ScheduleItem } from '../blueprints/schedules';

export interface WeatherAdjustedSchedule {
  item: ScheduleItem;
  scheduledDate: string;
  weatherOk: boolean;
  alternateDate?: string;
}

export function integrateWeather(
  schedule: ScheduleItem[],
  weather: WeatherDay[],
  startDate: Date
): WeatherAdjustedSchedule[] {
  const result: WeatherAdjustedSchedule[] = [];

  for (const item of schedule) {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + item.day - 1);
    const dateStr = targetDate.toISOString().split('T')[0];

    const dayWeather = weather.find(w => w.date === dateStr);
    const weatherOk = dayWeather?.isBuildable ?? true;

    let alternateDate: string | undefined;
    if (!weatherOk) {
      const nextGoodDay = weather.find(w => w.date > dateStr && w.isBuildable);
      alternateDate = nextGoodDay?.date;
    }

    result.push({ item, scheduledDate: dateStr, weatherOk, alternateDate });
  }

  return result;
}
