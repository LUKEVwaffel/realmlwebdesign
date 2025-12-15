import { useEffect, useRef, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface WebSocketMessage {
  type: "new_message" | "project_status" | "payment_update" | "document_update" | "notification" | "connected" | "pong";
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onProjectStatusChange?: (projectName: string, oldStatus: string, newStatus: string) => void;
  onNewMessage?: (senderName: string, preview: string) => void;
  onPaymentUpdate?: (paymentId: string, status: string, amount: string) => void;
  showToasts?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { showToasts = true } = options;
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          options.onMessage?.(message);

          switch (message.type) {
            case "new_message":
              options.onNewMessage?.(message.data.senderName, message.data.preview);
              if (showToasts) {
                toast({
                  title: "New Message",
                  description: `${message.data.senderName}: ${message.data.preview}`,
                });
              }
              break;

            case "project_status":
              options.onProjectStatusChange?.(
                message.data.projectName,
                message.data.oldStatus,
                message.data.newStatus
              );
              if (showToasts) {
                toast({
                  title: "Project Update",
                  description: `${message.data.projectName} status changed to ${message.data.newStatus.replace(/_/g, " ")}`,
                });
              }
              break;

            case "payment_update":
              options.onPaymentUpdate?.(
                message.data.paymentId,
                message.data.status,
                message.data.amount
              );
              if (showToasts && message.data.status === "paid") {
                toast({
                  title: "Payment Received",
                  description: `Payment of $${message.data.amount} has been confirmed`,
                });
              }
              break;

            case "document_update":
              if (showToasts) {
                toast({
                  title: "Document Update",
                  description: `${message.data.documentTitle} has been ${message.data.action}`,
                });
              }
              break;

            case "connected":
              break;
          }
        } catch (e) {
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };

    } catch (error) {
    }
  }, [options, showToasts, toast]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ping" }));
    }
  }, []);

  return {
    isConnected,
    sendPing,
    reconnect: connect,
    disconnect,
  };
}
