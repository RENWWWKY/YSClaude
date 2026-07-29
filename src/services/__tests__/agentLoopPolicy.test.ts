import { describe, expect, it } from 'vitest';
import {
  isParallelSubAgentBatch,
  parseToolArguments,
  shouldStopToolLoop,
  type ToolCallLike,
} from '../agentLoopPolicy';

const call = (id: string, name: string, args = '{}'): ToolCallLike => ({
  id,
  function: { name, arguments: args },
});

describe('shouldStopToolLoop', () => {
  it('stops when the model returns no tool calls', () => {
    expect(shouldStopToolLoop(undefined, 0, 3)).toBe(true);
    expect(shouldStopToolLoop([], 0, 3)).toBe(true);
  });

  it('stops when the completed count reaches the configured limit', () => {
    expect(shouldStopToolLoop([call('a', 'search')], 3, 3)).toBe(true);
  });

  it('continues when calls exist below the limit', () => {
    expect(shouldStopToolLoop([call('a', 'search')], 2, 3)).toBe(false);
  });
});

describe('isParallelSubAgentBatch', () => {
  it('allows independent sub-agent calls within the remaining budget', () => {
    const calls = [call('a', 'dispatch_subagent'), call('b', 'dispatch_subagent')];
    expect(isParallelSubAgentBatch(calls, 1, 3)).toBe(true);
  });

  it('keeps a single sub-agent call on the serial path', () => {
    expect(isParallelSubAgentBatch([call('a', 'dispatch_subagent')], 0, 3)).toBe(false);
  });

  it('keeps mixed tool batches serial to preserve dependencies', () => {
    const calls = [call('a', 'dispatch_subagent'), call('b', 'write_file')];
    expect(isParallelSubAgentBatch(calls, 0, 3)).toBe(false);
  });

  it('rejects a parallel batch that exceeds the remaining budget', () => {
    const calls = [call('a', 'dispatch_subagent'), call('b', 'dispatch_subagent')];
    expect(isParallelSubAgentBatch(calls, 2, 3)).toBe(false);
  });
});

describe('parseToolArguments', () => {
  it('parses a valid JSON object', () => {
    expect(parseToolArguments('{"query":"weather","limit":3}')).toEqual({
      query: 'weather', limit: 3,
    });
  });

  it('falls back for malformed JSON, arrays, and missing input', () => {
    expect(parseToolArguments('{broken')).toEqual({});
    expect(parseToolArguments('[1,2]')).toEqual({});
    expect(parseToolArguments(undefined)).toEqual({});
  });
});
