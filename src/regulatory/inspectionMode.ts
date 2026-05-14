import { Rule, Violation, checkWallCompliance } from '../compliance/complianceChecker';

export interface InspectionReport {
  projectId: string;
  inspectionDate: string;
  inspector: string;
  violations: Violation[];
  passed: boolean;
}

export function runInspection(
  projectId: string,
  inspector: string,
  elements: { type: string; heightFt?: number; setbackFt?: number | null; hasEngineeringStamp?: boolean }[],
  rules: Rule[]
): InspectionReport {
  const allViolations: Violation[] = [];

  for (const el of elements) {
    if (el.type === 'retaining_wall' && el.heightFt !== undefined) {
      const viols = checkWallCompliance({
        heightFt: el.heightFt,
        setbackFt: el.setbackFt ?? null,
        hasEngineeringStamp: el.hasEngineeringStamp ?? false,
      }, rules);
      allViolations.push(...viols);
    }
  }

  return {
    projectId,
    inspectionDate: new Date().toISOString(),
    inspector,
    violations: allViolations,
    passed: allViolations.filter(v => v.severity === 'critical' || v.severity === 'major').length === 0,
  };
}
