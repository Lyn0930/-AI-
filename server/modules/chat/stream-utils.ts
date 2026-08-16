type AnyRecord = Record<string, unknown>;

function isAsyncIterable(value: unknown): value is AsyncIterable<AnyRecord> {
  if (!value || typeof value !== 'object') return false;
  const iterator = (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator];
  return typeof iterator === 'function';
}

export function normalizeStream(resultOrStream: unknown): AsyncIterable<AnyRecord> {
  if (isAsyncIterable(resultOrStream)) {
    return resultOrStream;
  }
  if (
    resultOrStream &&
    typeof resultOrStream === 'object' &&
    'output' in resultOrStream &&
    isAsyncIterable((resultOrStream as { output?: unknown }).output)
  ) {
    return (resultOrStream as { output: AsyncIterable<AnyRecord> }).output;
  }
  throw new Error('Invalid callStream result: cannot find AsyncIterable stream');
}
