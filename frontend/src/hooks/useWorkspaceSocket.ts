import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useWorkspaceSocket(
  workspaceId: string = "apex-launch",
  onEvent?: (event: { type: string; [key: string]: any }) => void
) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!workspaceId) return;

    try {
      const url = `${WS_BASE}/ws/${workspaceId}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log(`[WebSocket] Connected to workspace ${workspaceId}`);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onEvent) {
            onEvent(parsed);
          }
        } catch (err) {
          console.error("[WebSocket] Message parsing error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log(`[WebSocket] Disconnected from workspace ${workspaceId}. Reconnecting in 3s...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn("[WebSocket] Error:", err);
        ws.close();
      };
    } catch (e) {
      console.error("[WebSocket] Connection attempt failed:", e);
    }
  }, [workspaceId, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}

