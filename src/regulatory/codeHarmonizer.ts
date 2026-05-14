import { Rule } from '../compliance/complianceChecker';

export type CodeSet = 'IRC' | 'IBC' | 'OSHA' | 'NEC' | 'LOCAL';

export interface JurisdictionConfig {
  state: string;
  county?: string;
  city?: string;
  activeCodes: CodeSet[];
  localAmendments?: Partial<Rule>[];
}

export function harmonizeRules(
  baseRules: Rule[],
  jurisdiction: JurisdictionConfig
): Rule[] {
  const filtered = baseRules.filter(r => {
    const codePrefix = r.id.split('-')[0].toUpperCase() as CodeSet;
    return jurisdiction.activeCodes.includes(codePrefix);
  });

  if (!jurisdiction.localAmendments) return filtered;

  return filtered.map(rule => {
    const amendment = jurisdiction.localAmendments!.find(a => a.id === rule.id);
    return amendment ? { ...rule, ...amendment } : rule;
  });
}
