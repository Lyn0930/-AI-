import { useEffect, useRef, useState } from 'react';

export type AgentChatEvent =
  | { type: 'session.created'; session: any }
  | { type: 'session.updated'; session: any }
  | { type: 'message.created'; sessionId: string; message: any }
  | { type: 'ping'; ts: number };

export type ChatEventHandler = (event: AgentChatEvent) => void;

export function useChatEvents(
  onEvent: ChatEventHandler,
  onConnectionChange?: (connected: boolean) => void,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  const onConnRef = useRef(onConnectionChange);

  useEffect(() => {
    onEventRef.current = onEvent;
    onConnRef.current = onConnectionChange;
  }, [onEvent, onConnectionChange]);

  useEffect(() => {
    const es = new EventSource('/api/chat/events', { withCredentials: true } as any);
    es.onopen = () => {
      setConnected(true);
      onConnRef.current?.(true);
    };
    es.onerror = () => {
      setConnected(false);
      onConnRef.current?.(false);
    };
    const handle = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as AgentChatEvent;
        if (data?.type === 'ping') return;
        onEventRef.current(data);
      } catch {}
    };
    es.addEventListener('session.created', handle as any);
    es.addEventListener('session.updated', handle as any);
    es.addEventListener('message.created', handle as any);
    es.onmessage = handle as any;
    return () => {
      es.close();
      setConnected(false);
      onConnRef.current?.(false);
    };
  }, []);
  return { connected };
}