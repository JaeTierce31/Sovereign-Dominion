import { describe, it, expect } from 'vitest';
import { checkWallCompliance, severityToNumber } from '../../src/compliance/complianceChecker';
import type { Rule } from '../../src/compliance/complianceChecker';

const TEST_RULES: Rule[] = [
  {
    id: 'IRC-R404-1',
    category: 'retaining_wall',
    predicate: { height_ft: { max: 4 } },
    message: 'Retaining walls over 4 ft require engineering stamp',
    severity: 'critical',
  },
  {
    id: 'IRC-R404-2',
    category: 'retaining_wall',
    predicate: { setback_ft: { min: 2 } },
    message: 'Minimum 2 ft setback required',
    severity: 'major',
  },
];

describe('checkWallCompliance', () => {
  it('returns no violations for compliant wall', () => {
    const violations = checkWallCompliance(
      { heightFt: 3, setbackFt: 5, hasEngineeringStamp: false },
      TEST_RULES
    );
    expect(violations).toHaveLength(0);
  });

  it('flags height violation without engineering stamp', () => {
    const violations = checkWallCompliance(
      { heightFt: 5, setbackFt: 5, hasEngineeringStamp: false },
      TEST_RULES
    );
    expect(violations.some(v => v.ruleId === 'IRC-R404-1')).toBe(true);
  });

  it('no height violation with engineering stamp', () => {
    const violations = checkWallCompliance(
      { heightFt: 6, setbackFt: 5, hasEngineeringStamp: true },
      TEST_RULES
    );
    expect(violations.some(v => v.ruleId === 'IRC-R404-1')).toBe(false);
  });

  it('flags setback violation', () => {
    const violations = checkWallCompliance(
      { heightFt: 3, setbackFt: 1, hasEngineeringStamp: false },
      TEST_RULES
    );
    expect(violations.some(v => v.ruleId === 'IRC-R404-2')).toBe(true);
  });
});

describe('severityToNumber', () => {
  it('returns correct ranking', () => {
    expect(severityToNumber('critical')).toBeGreaterThan(severityToNumber('major'));
    expect(severityToNumber('major')).toBeGreaterThan(severityToNumber('minor'));
    expect(severityToNumber('minor')).toBeGreaterThan(0);
    expect(severityToNumber('unknown')).toBe(0);
  });
});
