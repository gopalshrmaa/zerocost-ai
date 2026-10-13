import { useEffect, useState, useCallback, useRef } from 'react';

export type SSEConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export interface FinOpsEventPayload {
  id: string;
  type: string;
  timestamp: string;
  provider?: string;
  payload: Record<string, any>;
}

export function useRealtimeFinOps(onEventReceived?: (event: FinOpsEventPayload) => void) {
  const [status, setStatus] = useState<SSEConnectionStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<FinOpsEventPayload | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('connecting');
    const es = new EventSource('/api/events');
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('connected');
    };

    es.onmessage = (e) => {
      try {
        const parsed: FinOpsEventPayload = JSON.parse(e.data);
        setLastEvent(parsed);
        setEventCount(c => c + 1);
        if (onEventReceived) {
          onEventReceived(parsed);
        }
      } catch (err) {
        console.warn('Failed to parse SSE event payload:', err);
      }
    };

    es.onerror = () => {
      setStatus('reconnecting');
      es.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 4000);
    };
  }, [onEventReceived]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { status, lastEvent, eventCount, reconnect: connect };
}
