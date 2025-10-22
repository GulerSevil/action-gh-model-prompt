import { describe, it, expect } from 'vitest';
import { renderPickedMarkdown } from '../src/output/pickedMarkdown';

describe('renderPickedMarkdown', () => {
  it('renders arrays as bullet lists', () => {
    expect(renderPickedMarkdown(['a','b'])).toBe('- a\n- b');
  });
  it('renders object of selectors as sections', () => {
    const md = renderPickedMarkdown({ 'a.b': [1,2], 'c': 'x' })!;
    expect(md).toContain('### a.b');
    expect(md).toContain('- 1');
    expect(md).toContain('### c');
    expect(md).toContain('x');
  });
  it('renders primitives as strings', () => {
    expect(renderPickedMarkdown(42)).toBe('42');
  });
});


