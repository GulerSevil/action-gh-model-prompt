import { describe, it, expect } from 'vitest';
import { pickByDotPath, aggregatePickedValues } from '../src/prompt/pick';
import { worstSeverity } from '../src/core/util/severity';

describe('pickByDotPath', () => {
  it('picks nested properties', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(pickByDotPath(obj, '.a.b.c')).toBe(42);
  });

  it('picks array indices', () => {
    const obj = { items: [{ v: 1 }, { v: 2 }] };
    expect(pickByDotPath(obj, '.items[1].v')).toBe(2);
  });

  it('returns undefined for missing', () => {
    expect(pickByDotPath({}, '.x.y')).toBeUndefined();
  });
});

describe('aggregatePickedValues', () => {
  const vals = ['low', 'medium', 'high'];
  it('none returns undefined', () => {
    expect(aggregatePickedValues(vals, 'none', worstSeverity)).toBeUndefined();
  });
  it('first returns first', () => {
    expect(aggregatePickedValues(vals, 'first', worstSeverity)).toBe('low');
  });
  it('join concatenates with newline', () => {
    expect(aggregatePickedValues(['a','b'], 'join', worstSeverity)).toBe('a\nb');
  });
  it('worst_severity ranks correctly', () => {
    expect(aggregatePickedValues(vals, 'worst_severity', worstSeverity)).toBe('high');
  });
});


