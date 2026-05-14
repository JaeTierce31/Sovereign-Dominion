import { Rule, Violation, checkWallCompliance } from '../compliance/complianceChecker';

export function runAllCompliance(
  element: { type: string; heightFt?: number; setbackFt?: number | null; hasEngineeringStamp?: boolean },
  rules: Rule[]
): Violation[] {
  if (element.type === 'retaining_wall' && element.heightFt !== undefined) {
    return checkWallCompliance({
      heightFt: element.heightFt,
      setbackFt: element.setbackFt ?? null,
      hasEngineeringStamp: element.hasEngineeringStamp ?? false,
    }, rules);
  }
  return [];
}

export function violationsToARMask(violations: Violation[], splatCount: number): Uint32Array {
  const mask = new Uint32Array(splatCount);
  if (violations.some(v => v.severity === 'critical')) mask.fill(1);
  return mask;
}
