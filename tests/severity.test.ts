import { describe, it, expect } from 'vitest';
import { severityRank, worstSeverity } from '../src/core/util/severity';

describe('severity', () => {
  it('ranks severities', () => {
    expect(severityRank('low')).toBe(0);
    expect(severityRank('medium')).toBe(1);
    expect(severityRank('high')).toBe(2);
    expect(severityRank('block')).toBe(3);
  });

  it('finds worst severity', () => {
    expect(worstSeverity(['low','medium','high'])).toBe('high');
    expect(worstSeverity(['medium','block','low'])).toBe('block');
  });
});


