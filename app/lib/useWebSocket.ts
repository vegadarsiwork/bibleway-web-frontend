"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type MessageHandler = (data: { type: string; data: Record<string, unknown> }) => void;

interface UseWebSocketOptions {
  onMessage?: MessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectAttempts = useRef(0);
  const handlersRef = useRef(options);
  handlersRef.current = options;
  const unmounted = useRef(false);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || unmounted.current) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Close any stale connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "https://api-bibleway.up.railway.app")
      .replace(/\/+$/, "")          // strip trailing slashes first
      .replace(/^http/, "ws")
      .replace(/\/api\/v1$/, "");

    try {
      const ws = new WebSocket(`${baseUrl}/ws/chat/?token=${token}`);
      let heartbeatInterval: ReturnType<typeof setInterval>;

      ws.onopen = () => {
        if (unmounted.current) { ws.close(); return; }
        setConnected(true);
        reconnectAttempts.current = 0;
        handlersRef.current.onConnect?.();
        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "pong", request_id: crypto.randomUUID() }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handlersRef.current.onMessage?.(data);
        } catch { /* malformed message */ }
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        setConnected(false);
        wsRef.current = null;
        handlersRef.current.onDisconnect?.();
        if (unmounted.current) return;
        const currentToken = localStorage.getItem("access_token");
        if (!currentToken) return;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        reconnectTimeout.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
      wsRef.current = ws;
    } catch { /* connection failed */ }
  }, []);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      clearTimeout(reconnectTimeout.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((action: string, data: Record<string, unknown> = {}): string | false => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    const requestId = crypto.randomUUID();
    wsRef.current.send(JSON.stringify({ action, request_id: requestId, ...data }));
    return requestId;
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    clearTimeout(reconnectTimeout.current);
    connect();
  }, [connect]);

  return { connected, send, reconnect };
}
