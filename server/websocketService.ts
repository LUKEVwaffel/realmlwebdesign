import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { URL } from "url";

const JWT_SECRET = process.env.SESSION_SECRET;

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: "admin" | "client";
  clientId?: string;
  isAlive?: boolean;
}

interface NotificationPayload {
  type: "new_message" | "project_status" | "payment_update" | "document_update" | "notification";
  data: any;
  timestamp: string;
}

const connectedClients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
const adminConnections: Set<AuthenticatedWebSocket> = new Set();

let wss: WebSocketServer | null = null;

export function initializeWebSocket(httpServer: Server): WebSocketServer {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token || !JWT_SECRET) {
      ws.close(4001, "Unauthorized");
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: "admin" | "client";
        clientId?: string;
      };

      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      ws.isAlive = true;

      if (decoded.role === "admin") {
        adminConnections.add(ws);
      } else if (decoded.clientId) {
        ws.clientId = decoded.clientId;
        if (!connectedClients.has(decoded.clientId)) {
          connectedClients.set(decoded.clientId, new Set());
        }
        connectedClients.get(decoded.clientId)!.add(ws);
      }

      ws.send(JSON.stringify({
        type: "connected",
        data: { message: "Connected to notification service" },
        timestamp: new Date().toISOString(),
      }));

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        if (ws.userRole === "admin") {
          adminConnections.delete(ws);
        } else if (ws.clientId) {
          const clientSockets = connectedClients.get(ws.clientId);
          if (clientSockets) {
            clientSockets.delete(ws);
            if (clientSockets.size === 0) {
              connectedClients.delete(ws.clientId);
            }
          }
        }
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
          }
        } catch (e) {
        }
      });

    } catch (error) {
      ws.close(4001, "Invalid token");
    }
  });

  const interval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;
      if (authWs.isAlive === false) {
        return authWs.terminate();
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  console.log("WebSocket server initialized on /ws");
  return wss;
}

function broadcast(sockets: Set<AuthenticatedWebSocket>, payload: NotificationPayload) {
  const message = JSON.stringify(payload);
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function notifyClient(clientId: string, payload: Omit<NotificationPayload, "timestamp">) {
  const clientSockets = connectedClients.get(clientId);
  if (clientSockets) {
    broadcast(clientSockets, { ...payload, timestamp: new Date().toISOString() });
  }
}

export function notifyAdmins(payload: Omit<NotificationPayload, "timestamp">) {
  broadcast(adminConnections, { ...payload, timestamp: new Date().toISOString() });
}

export function notifyNewMessage(clientId: string, message: { senderType: string; senderName: string; preview: string }) {
  const payload: Omit<NotificationPayload, "timestamp"> = {
    type: "new_message",
    data: message,
  };
  
  if (message.senderType === "client") {
    notifyAdmins(payload);
  } else {
    notifyClient(clientId, payload);
  }
}

export function notifyProjectStatusUpdate(clientId: string, projectName: string, oldStatus: string, newStatus: string) {
  notifyClient(clientId, {
    type: "project_status",
    data: { projectName, oldStatus, newStatus },
  });
}

export function notifyPaymentUpdate(clientId: string, paymentId: string, status: string, amount: string) {
  const payload: Omit<NotificationPayload, "timestamp"> = {
    type: "payment_update",
    data: { paymentId, status, amount },
  };
  
  notifyClient(clientId, payload);
  notifyAdmins(payload);
}

export function notifyDocumentUpdate(clientId: string, documentTitle: string, action: "uploaded" | "signed" | "updated") {
  const payload: Omit<NotificationPayload, "timestamp"> = {
    type: "document_update",
    data: { documentTitle, action },
  };
  
  notifyClient(clientId, payload);
  notifyAdmins(payload);
}

export function getConnectionStats() {
  let totalClientConnections = 0;
  connectedClients.forEach((sockets) => {
    totalClientConnections += sockets.size;
  });
  
  return {
    adminConnections: adminConnections.size,
    clientConnections: totalClientConnections,
    uniqueClients: connectedClients.size,
  };
}
