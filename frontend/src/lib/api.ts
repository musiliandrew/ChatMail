const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

export type Me = {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  provider: string;
};

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function authGoogleStart(): Promise<{ url: string }> {
  return request("/auth/google/start");
}

export async function authGoogleCallback(code: string): Promise<{ access_token: string; token_type: string; is_new: boolean; }> {
  const u = new URL(`${API_BASE}/auth/google/callback`);
  u.searchParams.set("code", code);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMe(): Promise<Me> {
  return request("/auth/me");
}

export async function updateProfile(data: { display_name?: string; avatar_url?: string; }): Promise<{ ok: boolean }> {
  return request("/auth/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Conversations
export type Conversation = { id: string; subject?: string | null; created_at: string };
export async function listConversations(): Promise<Conversation[]> {
  return request("/conversations");
}
export async function createConversation(payload: { participants: string[]; subject?: string | null }): Promise<Conversation> {
  return request("/conversations", { method: "POST", body: JSON.stringify(payload) });
}

// Messages
export type Message = {
  id: string;
  conversation_id: string;
  sender_user_id?: string | null;
  external_from_email?: string | null;
  body_text?: string | null;
  body_html?: string | null;
  direction: 'outbound' | 'inbound';
  status: 'sent' | 'delivered' | 'read' | string;
  created_at: string;
};
export async function listMessages(conversationId: string): Promise<Message[]> {
  return request(`/messages/${conversationId}`);
}
export async function sendMessage(conversationId: string, payload: { text?: string; attachments?: string[] }): Promise<Message> {
  return request(`/messages/${conversationId}`, { method: "POST", body: JSON.stringify(payload) });
}

// Users / Invites
export async function userExists(email: string): Promise<{ exists: boolean }> {
  const u = new URL(`${API_BASE}/users/exists`);
  u.searchParams.set("email", email);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function createInvite(email: string): Promise<{ status: string; token?: string }> {
  const u = new URL(`${API_BASE}/users/invites`);
  u.searchParams.set("email", email);
  const res = await fetch(u.toString(), { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Presence / Typing / Receipts
export async function heartbeat(): Promise<{ ok: boolean; now: string }> {
  return request("/presence/heartbeat", { method: "POST" });
}
export async function getLastSeen(user_email: string): Promise<{ online: boolean; last_seen: string | null }> {
  const u = new URL(`${API_BASE}/presence/last-seen`);
  u.searchParams.set("user_email", user_email);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function setTyping(conversation_id: string, typing: boolean): Promise<{ ok: boolean }> {
  return request(`/typing`, { method: "POST", body: JSON.stringify({ conversation_id, typing }) });
}
export async function receiptsDelivered(conversation_id: string, message_ids: string[]): Promise<{ ok: boolean }> {
  return request(`/receipts/delivered`, { method: "POST", body: JSON.stringify({ conversation_id, message_ids }) });
}
export async function receiptsRead(conversation_id: string, message_ids: string[]): Promise<{ ok: boolean }> {
  return request(`/receipts/read`, { method: "POST", body: JSON.stringify({ conversation_id, message_ids }) });
}

// Conversation participants (for presence tracking)
export async function getParticipants(conversation_id: string): Promise<{ emails: string[] }> {
  return request(`/conversations/${conversation_id}/participants`);
}

export function saveToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}
