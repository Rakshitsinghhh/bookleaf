'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext({
  connected: false,
  lastEvent: null
});

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.BACKEND_URL || 'http://localhost:5001';
}

export function RealtimeProvider({ children }) {
  const { user, role } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;

    function connectSSE() {
      const apiBase = getApiBase();
      const url = `${apiBase}/api/realtime/stream?authorId=${user?.author_id || ''}&role=${role}`;
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.addEventListener('ticket_created', (e) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent({ type: 'ticket_created', data: data.payload, timestamp: Date.now() });
        } catch (err) {
          console.error('SSE ticket_created parse error:', err);
        }
      });

      eventSource.addEventListener('ticket_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent({ type: 'ticket_updated', data: data.payload, timestamp: Date.now() });
        } catch (err) {
          console.error('SSE ticket_updated parse error:', err);
        }
      });

      eventSource.addEventListener('new_message', (e) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent({ type: 'new_message', data: data.payload, timestamp: Date.now() });
        } catch (err) {
          console.error('SSE new_message parse error:', err);
        }
      });

      eventSource.addEventListener('database_reset', () => {
        setLastEvent({ type: 'database_reset', timestamp: Date.now() });
      });

      eventSource.onerror = () => {
        setConnected(false);
        eventSource.close();
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user?.author_id, role]);

  return (
    <RealtimeContext.Provider value={{ connected, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
