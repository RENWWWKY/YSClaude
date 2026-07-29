export interface ToolCallLike {
  id: string;
  function: { name: string; arguments?: string };
}

export function shouldStopToolLoop(
  toolCalls: ToolCallLike[] | undefined,
  completedToolCalls: number,
  maxToolCalls: number
): boolean {
  return !toolCalls || toolCalls.length === 0 || completedToolCalls >= maxToolCalls;
}

export function isParallelSubAgentBatch(
  toolCalls: ToolCallLike[],
  completedToolCalls: number,
  maxToolCalls: number
): boolean {
  return toolCalls.length > 1 &&
    completedToolCalls + toolCalls.length <= maxToolCalls &&
    toolCalls.every((toolCall) => toolCall.function.name === 'dispatch_subagent');
}

export function parseToolArguments(rawArguments: string | undefined): Record<string, any> {
  try {
    const parsed = JSON.parse(rawArguments || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
