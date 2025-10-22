import { describe, it, expect } from 'vitest';
import { renderMarkdownReport } from '../src/output/report';

describe('renderMarkdownReport', () => {
  it('renders headings with capitalized keys and includes raw message', () => {
    const parsed: any = { detailed_analysis: { executive_summary: { risk: 'HIGH' } }, reasons: ['a','b'] };
    const message = '{"ok":true}';
    const md = renderMarkdownReport(parsed, message);
    expect(md).toContain('# Report');
    expect(md).toContain('## Data');
    expect(md).toContain('### Detailed analysis');
    expect(md).toContain('### Reasons');
    expect(md).toContain('## Raw Message Content');
    expect(md).toContain(message);
  });
});


