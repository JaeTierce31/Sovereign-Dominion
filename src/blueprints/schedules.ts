export interface ScheduleItem {
  day: number;
  task: string;
  crew: string;
  estimatedHours: number;
  dependsOn?: number[];
}

export function buildConstructionSchedule(
  elements: { type: string; quantity: number }[]
): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  let day = 1;

  for (const el of elements) {
    const hoursPerUnit = getHoursPerUnit(el.type);
    const totalHours = Math.ceil(el.quantity * hoursPerUnit);
    const days = Math.ceil(totalHours / 8);

    for (let d = 0; d < days; d++) {
      schedule.push({
        day: day + d,
        task: `Install ${el.type} (day ${d + 1}/${days})`,
        crew: getDefaultCrew(el.type),
        estimatedHours: d < days - 1 ? 8 : totalHours % 8 || 8,
      });
    }
    day += days + 1;
  }

  return schedule;
}

function getHoursPerUnit(type: string): number {
  const map: Record<string, number> = {
    retaining_wall: 0.25,
    patio: 0.15,
    deck: 0.2,
    fence: 0.1,
  };
  return map[type] ?? 0.2;
}

function getDefaultCrew(type: string): string {
  const map: Record<string, string> = {
    retaining_wall: 'Masonry Crew',
    patio: 'Hardscape Crew',
    deck: 'Carpentry Crew',
    fence: 'Fence Crew',
  };
  return map[type] ?? 'General Crew';
}
