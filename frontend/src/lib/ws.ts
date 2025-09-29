import { WS_BASE } from "@/lib/api";

export type WSEvent = {
  conversation_id?: string;
  user?: string;
  typing?: boolean;
  message_ids?: string[];
  status?: string; // delivered|read
};

export function openWS(onMessage: (ev: WSEvent) => void): WebSocket | null {
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
  if (!token) return null;
  const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data as WSEvent);
    } catch {}
  };
  return ws;
}
