export interface ParsedToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export function createEmptyToolCall(): ParsedToolCall {
  return { id: '', type: 'function', function: { name: '', arguments: '' } };
}

export function resolveToolCallIndex(
  toolCallParts: ParsedToolCall[],
  partial: any,
  position: number,
  batchLength: number,
  lastToolCallIndex: number
): number {
  const partialId = typeof partial.id === 'string' ? partial.id : '';
  if (partialId) {
    const existingById = toolCallParts.findIndex((toolCall) => toolCall?.id === partialId);
    if (existingById >= 0) return existingById;
  }

  if (typeof partial.index === 'number') {
    const existing = toolCallParts[partial.index];
    if (!existing || !existing.id || !partialId || existing.id === partialId) {
      return partial.index;
    }
    return toolCallParts.length;
  }

  if (batchLength > 1) {
    const existing = toolCallParts[position];
    if (!existing || !existing.id || !partialId || existing.id === partialId) {
      return position;
    }
  }

  return lastToolCallIndex >= 0 ? lastToolCallIndex : toolCallParts.length;
}

export function mergeToolName(current: string, incoming: string): string {
  if (!current) return incoming;
  if (incoming === current) return current;
  if (incoming.startsWith(current)) return incoming;
  if (current.startsWith(incoming)) return current;
  return current + incoming;
}

export function splitKnownToolNames(name: string, knownToolNames: Set<string>): string[] {
  if (knownToolNames.has(name)) return [name];
  const namesByLength = [...knownToolNames].sort((a, b) => b.length - a.length);
  const result: string[] = [];
  let remaining = name;

  while (remaining) {
    const nextName = namesByLength.find((toolName) => remaining.startsWith(toolName));
    if (!nextName) return [name];
    result.push(nextName);
    remaining = remaining.slice(nextName.length);
  }
  return result.length > 0 ? result : [name];
}

export function expandConcatenatedToolNames(
  toolCalls: ParsedToolCall[],
  knownToolNames: Set<string>
): ParsedToolCall[] {
  const expanded: ParsedToolCall[] = [];
  toolCalls.forEach((toolCall, index) => {
    const names = splitKnownToolNames(toolCall.function.name, knownToolNames);
    if (names.length <= 1) {
      expanded.push({ ...toolCall, id: toolCall.id || `call_${index}` });
      return;
    }
    names.forEach((name, nameIndex) => {
      expanded.push({
        ...toolCall,
        id: nameIndex === 0
          ? toolCall.id || `call_${index}`
          : `${toolCall.id || `call_${index}`}_${nameIndex}`,
        function: {
          name,
          arguments: nameIndex === names.length - 1 ? toolCall.function.arguments : '{}',
        },
      });
    });
  });
  return expanded;
}

export function consumeSseBuffer(
  buffer: string,
  flush: boolean,
  onJson: (json: any) => void
): string {
  const lines = buffer.split(/\r?\n/);
  const pending = flush ? '' : lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('data: ')) continue;
    const data = trimmed.slice(6).trim();
    if (!data || data === '[DONE]') continue;
    try {
      onJson(JSON.parse(data));
    } catch {
      // A malformed event must not terminate the remaining stream.
    }
  }
  return pending;
}
