import { useState, useRef, useEffect } from "react";
import { Send, Phone, Video, Info, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "./MessageBubble";
import { EmojiPicker } from "./EmojiPicker";
import { FileUpload } from "./FileUpload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, listMessages, sendMessage as apiSendMessage, type Message as ApiMessage, receiptsDelivered, receiptsRead, setTyping, heartbeat, getParticipants, getLastSeen } from "@/lib/api";
import { openWS, type WSEvent } from "@/lib/ws";

interface FileAttachment {
  file: File;
  url: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: FileAttachment[];
}

interface ChatAreaProps {
  chatId: string;
  onBack?: () => void; // optional back handler for mobile
}

// Mock messages
const mockMessages: Record<string, Message[]> = {
  user1: [
    {
      id: '1',
      content: "Hi there! Hope you're having a great day 😊",
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false,
      status: 'read'
    },
    {
      id: '2',
      content: "Hey Alice! Thanks, you too! Just wanted to follow up on our project discussion.",
      timestamp: new Date(Date.now() - 3500000),
      isOwn: true,
      status: 'read'
    },
    {
      id: '3',
      content: "Absolutely! I've been thinking about the implementation details. When would be a good time to schedule our meeting?",
      timestamp: new Date(Date.now() - 3000000),
      isOwn: false,
      status: 'read'
    },
    {
      id: '4',
      content: "How about tomorrow at 2 PM? I should have the initial mockups ready by then.",
      timestamp: new Date(Date.now() - 120000),
      isOwn: true,
      status: 'delivered'
    }
  ]
};

const chatUsers = {
  user1: {
    name: "Alice Johnson",
    email: "alice.johnson@gmail.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b109?w=40&h=40&fit=crop&crop=face",
    isOnline: true
  }
};

export function ChatArea({ chatId, onBack }: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = chatUsers[chatId as keyof typeof chatUsers];

  const qc = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const msgsQuery = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => listMessages(chatId),
    enabled: !!chatId,
  });
  const sendMutation = useMutation({
    mutationFn: (text: string) => apiSendMessage(chatId, { text }),
    onSuccess: () => {
      setMessage("");
      setSelectedFiles([]);
      qc.invalidateQueries({ queryKey: ["messages", chatId] });
    },
  });

  // Presence / typing / ws
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const [otherEmail, setOtherEmail] = useState<string | null>(null);
  const [typingOther, setTypingOther] = useState(false);
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingReadRef = useRef<Set<string>>(new Set());
  const readDebounceRef = useRef<number | null>(null);

  const refreshLastSeen = async (email: string) => {
    try {
      const ls = await getLastSeen(email);
      setOnline(ls.online);
      setLastSeen(ls.last_seen);
    } catch {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgsQuery.data]);

  const handleSend = () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    // Attachments not wired yet; send text only for now
    sendMutation.mutate(message.trim());
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFilesSelected = (files: FileAttachment[]) => {
    setSelectedFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Hook participants to find the "other" email for presence
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = meQuery.data;
        if (!me) return;
        // participants endpoint may include my email and external(s)
        const parts = await getParticipants(chatId);
        const other = parts.emails.find((e) => e !== me.email) || null;
        if (mounted) {
          setOtherEmail(other);
          if (other) refreshLastSeen(other);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [chatId, meQuery.data]);

  // WS subscription
  useEffect(() => {
    if (wsRef.current) return; // single connection for this component
    const ws = openWS((ev: WSEvent) => {
      if (!ev || !ev.conversation_id || ev.conversation_id !== chatId) return;
      // typing events
      if (typeof ev.typing === 'boolean' && ev.user && ev.user !== meQuery.data?.email) {
        setTypingOther(ev.typing);
      }
      // receipt updates → refresh messages
      if (ev.status && ev.message_ids && ev.message_ids.length) {
        qc.invalidateQueries({ queryKey: ["messages", chatId] });
      }
    });
    wsRef.current = ws;
    return () => {
      ws?.close();
      wsRef.current = null;
    };
  }, [chatId, meQuery.data?.email, qc]);

  // Heartbeat every 30s
  useEffect(() => {
    const tick = async () => { try { await heartbeat(); } catch {} };
    tick();
    const id = window.setInterval(tick, 30000);
    heartbeatRef.current = id;
    return () => { if (heartbeatRef.current) window.clearInterval(heartbeatRef.current); };
  }, []);

  // Mark delivered on load
  useEffect(() => {
    const msgs = msgsQuery.data;
    if (!msgs) return;
    const needDelivered = msgs.filter(m => m.direction === 'inbound' && m.status === 'sent').map(m => m.id);
    if (needDelivered.length) {
      receiptsDelivered(chatId, needDelivered).catch(() => {});
    }
  }, [chatId, msgsQuery.data, qc]);

  // Typing: send true while typing and false after idle
  useEffect(() => {
    if (!message.trim()) return; // only on typing
    const doTyping = () => setTyping(chatId, true).catch(() => {});
    const stopTyping = () => setTyping(chatId, false).catch(() => {});
    doTyping();
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(stopTyping, 1000);
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      stopTyping();
    };
  }, [message, chatId]);

  const formatLastSeen = () => {
    if (online) return <span className="text-gmail-green">Online</span>;
    if (!lastSeen) return null;
    const d = new Date(lastSeen);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ago`;
  };

  // Setup IntersectionObserver for viewport-based read receipts
  useEffect(() => {
    if (!msgsQuery.data) return;
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const mid = el.getAttribute('data-mid');
        const dir = el.getAttribute('data-dir');
        const status = el.getAttribute('data-status');
        if (!mid || dir !== 'inbound') continue;
        // Consider read if at least 60% visible
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6 && status !== 'read') {
          pendingReadRef.current.add(mid);
        }
      }
      // Debounce sending read receipts
      if (readDebounceRef.current) window.clearTimeout(readDebounceRef.current);
      readDebounceRef.current = window.setTimeout(async () => {
        if (pendingReadRef.current.size === 0) return;
        const ids = Array.from(pendingReadRef.current);
        pendingReadRef.current.clear();
        try {
          await receiptsRead(chatId, ids);
          qc.invalidateQueries({ queryKey: ["messages", chatId] });
        } catch {}
      }, 400);
    }, { threshold: [0, 0.6, 1] });

    observerRef.current = observer;

    // Attach to inbound, non-read message wrappers
    const container = document.getElementById(`chat-msgs-${chatId}`);
    if (container) {
      const items = container.querySelectorAll('[data-mid]');
      items.forEach((el) => observer.observe(el));
    }

    return () => {
      observer.disconnect();
    };
  }, [chatId, msgsQuery.data, qc]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-gmail-blue to-gmail-red text-white">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {user?.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gmail-green rounded-full border-2 border-background" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">{user?.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{user?.email}</span>
              <span>•</span>
              <span>{formatLastSeen()}</span>
              {typingOther && <span className="italic text-primary">Typing…</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hover:bg-gmail-blue/10">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-gmail-blue/10">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-gmail-blue/10">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-chat-background" id={`chat-msgs-${chatId}`}>
        <div className="space-y-4">
          {msgsQuery.data?.map((m: ApiMessage) => {
            const isOwn = m.direction === 'outbound';
            const bubble: Message = {
              id: m.id,
              content: m.body_text || "",
              timestamp: new Date(m.created_at),
              isOwn,
              status: m.status as any,
            };
            return (
              <div
                key={bubble.id}
                data-mid={m.id}
                data-dir={m.direction}
                data-status={m.status}
              >
                <MessageBubble message={bubble} />
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background sticky bottom-0 supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
        <div className="space-y-3">
          {/* File Upload Area */}
          <FileUpload
            selectedFiles={selectedFiles}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemoveFile}
          />
          
          {/* Message Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-10 resize-none"
              />
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                open={showEmojiPicker}
                onOpenChange={setShowEmojiPicker}
              />
            </div>
            
            <Button
              onClick={handleSend}
              disabled={!message.trim() && selectedFiles.length === 0}
              className="bg-gradient-to-r from-gmail-red to-gmail-blue hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}