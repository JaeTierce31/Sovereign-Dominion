export interface Rule {
  id: string;
  category: string;
  predicate: Record<string, any>;
  message: string;
  severity: 'minor' | 'major' | 'critical';
}

export interface Violation {
  ruleId: string;
  elementName: string;
  elementId: string;
  message: string;
  severity: 'minor' | 'major' | 'critical';
}

export function checkWallCompliance(
  element: { heightFt: number; setbackFt: number | null; hasEngineeringStamp: boolean },
  rules: Rule[]
): Violation[] {
  const violations: Violation[] = [];
  for (const rule of rules) {
    if (rule.category !== 'retaining_wall') continue;
    if (rule.predicate.height_ft?.max && element.heightFt > rule.predicate.height_ft.max && !element.hasEngineeringStamp) {
      violations.push({ ruleId: rule.id, elementName: 'RetainingWall', elementId: '', message: rule.message, severity: rule.severity });
    }
    if (rule.predicate.setback_ft?.min && element.setbackFt !== null && element.setbackFt < rule.predicate.setback_ft.min) {
      violations.push({ ruleId: rule.id, elementName: 'RetainingWall', elementId: '', message: rule.message, severity: rule.severity });
    }
  }
  return violations;
}

export function severityToNumber(severity: string): number {
  switch (severity) {
    case 'critical': return 3;
    case 'major': return 2;
    case 'minor': return 1;
    default: return 0;
  }
}
