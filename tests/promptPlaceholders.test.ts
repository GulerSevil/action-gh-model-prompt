import { describe, it, expect } from 'vitest';
import { parseFilesAndDiff } from '../src/core/util/promptPlaceholders';

describe('parseFilesAndDiff', () => {
  it('parses FILE_LIST and DIFF from placeholders', () => {
    const placeholders: any = { FILE_LIST: 'a.txt\nb.txt', DIFF: 'diffdata' };
    const { files, diff } = parseFilesAndDiff(placeholders);
    expect(files).toEqual(['a.txt','b.txt']);
    expect(diff).toBe('diffdata');
  });

  it('supports CHANGED_FILES alias', () => {
    const placeholders: any = { CHANGED_FILES: 'x\n y ' };
    const { files } = parseFilesAndDiff(placeholders);
    expect(files).toEqual(['x','y']);
  });
});


