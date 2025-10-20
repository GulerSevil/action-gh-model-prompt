import { describe, it, expect } from 'vitest';
import { splitIntoBatches, filterDiffByFiles } from '../src/core/batching';

describe('splitIntoBatches', () => {
  it('splits items by size', () => {
    const batches = splitIntoBatches([1,2,3,4,5], 2);
    expect(batches).toEqual([[1,2],[3,4],[5]]);
  });
});

describe('filterDiffByFiles', () => {
  it('keeps only hunks for requested files', () => {
    const diff = [
      'diff --git a/a.txt b/a.txt',
      '--- a/a.txt',
      '+++ b/a.txt',
      '+A change',
      'diff --git a/b.txt b/b.txt',
      '--- a/b.txt',
      '+++ b/b.txt',
      '+B change',
    ].join('\n');
    const filtered = filterDiffByFiles(diff, ['a.txt']);
    expect(filtered.includes('+++ b/a.txt')).toBe(true);
    expect(filtered.includes('+++ b/b.txt')).toBe(false);
  });
});


