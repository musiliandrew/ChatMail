import { useState } from "react";
import { Search, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";
import { NewChatDialog } from "./NewChatDialog";
import { ThemeToggle } from "./ThemeToggle";
import { UserProfile } from "./UserProfile";

export function ChatLayout() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  return (
    <div className="flex h-dvh bg-background">
      {/* Sidebar (Desktop and up) */}
      <div className="hidden md:flex md:w-80 bg-sidebar-background border-r border-border flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src="/app-logo.svg" alt="MailChat" className="h-6 w-6" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-gmail-red to-gmail-blue bg-clip-text text-transparent">
                MailChat
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <UserProfile />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewChat(true)}
                className="hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-background/50"
            />
          </div>
        </div>

        {/* Conversations */}
        <ConversationList
          selectedChat={selectedChat}
          onChatSelect={setSelectedChat}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex">
        {/* Mobile: show conversation list full-screen when no chat is selected */}
        {!selectedChat && (
          <div className="flex md:hidden flex-1 flex-col">
            {/* Mobile Header */}
            <div className="p-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/app-logo.svg" alt="MailChat" className="h-6 w-6" />
                <h1 className="text-lg font-semibold bg-gradient-to-r from-gmail-red to-gmail-blue bg-clip-text text-transparent">
                  MailChat
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <UserProfile />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Mobile Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-10 bg-background/50" />
              </div>
            </div>
            {/* Conversations */}
            <ConversationList selectedChat={selectedChat} onChatSelect={setSelectedChat} />
          </div>
        )}

        {/* Chat Pane */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            <ChatArea
              chatId={selectedChat}
              onBack={() => setSelectedChat(null)}
            />
          </div>
        ) : (
          // Desktop empty state
          <div className="hidden md:flex flex-1 items-center justify-center bg-chat-background">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gmail-red to-gmail-blue flex items-center justify-center">
                <span className="text-4xl text-white">📧</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to MailChat</h2>
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        onChatCreated={setSelectedChat}
      />
    </div>
  );
}