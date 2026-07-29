import { describe, expect, it, vi } from 'vitest';
import {
  consumeSseBuffer,
  expandConcatenatedToolNames,
  mergeToolName,
  resolveToolCallIndex,
  type ParsedToolCall,
} from '../sseParser';

describe('consumeSseBuffer', () => {
  it('preserves an incomplete line until the next chunk', () => {
    const onJson = vi.fn();
    const pending = consumeSseBuffer('data: {"choices":[{"delta":{"content":"你', false, onJson);
    expect(onJson).not.toHaveBeenCalled();
    expect(pending).toContain('content');

    const rest = `${pending}好"}}]}\n\n`;
    expect(consumeSseBuffer(rest, false, onJson)).toBe('');
    expect(onJson).toHaveBeenCalledWith({ choices: [{ delta: { content: '你好' } }] });
  });

  it('skips comments, DONE markers, and malformed events without stopping', () => {
    const values: any[] = [];
    const stream = [
      ': keep-alive',
      'data: not-json',
      'data: [DONE]',
      'data: {"ok":true}',
      '',
    ].join('\n');
    consumeSseBuffer(stream, true, (json) => values.push(json));
    expect(values).toEqual([{ ok: true }]);
  });

  it('supports CRLF and flushes a final complete event without trailing newline', () => {
    const values: any[] = [];
    consumeSseBuffer('data: {"value":1}\r\ndata: {"value":2}', true, (json) => values.push(json));
    expect(values).toEqual([{ value: 1 }, { value: 2 }]);
  });
});

describe('tool call delta compatibility', () => {
  const call = (id: string, name: string, args = ''): ParsedToolCall => ({
    id,
    type: 'function',
    function: { name, arguments: args },
  });

  it('merges both incremental and repeated full function names', () => {
    expect(mergeToolName('get_', 'weather')).toBe('get_weather');
    expect(mergeToolName('get_weather', 'get_weather')).toBe('get_weather');
    expect(mergeToolName('get_', 'get_weather')).toBe('get_weather');
  });

  it('resolves an existing call by id even if array position changes', () => {
    const calls = [call('call_a', 'search'), call('call_b', 'calendar')];
    expect(resolveToolCallIndex(calls, { id: 'call_b' }, 0, 1, 0)).toBe(1);
  });

  it('splits concatenated known tool names and keeps arguments on the final call', () => {
    const expanded = expandConcatenatedToolNames(
      [call('call_a', 'searchcalendar', '{"date":"tomorrow"}')],
      new Set(['search', 'calendar'])
    );
    expect(expanded).toHaveLength(2);
    expect(expanded.map((item) => item.function.name)).toEqual(['search', 'calendar']);
    expect(expanded[0].function.arguments).toBe('{}');
    expect(expanded[1].function.arguments).toBe('{"date":"tomorrow"}');
  });
});
