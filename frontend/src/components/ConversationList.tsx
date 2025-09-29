import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { listConversations, type Conversation } from "@/lib/api";

interface ConversationListProps {
  selectedChat: string | null;
  onChatSelect: (chatId: string) => void;
}

export function ConversationList({ selectedChat, onChatSelect }: ConversationListProps) {
  const { data, isLoading } = useQuery({ queryKey: ["conversations"], queryFn: listConversations });

  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading && (
        <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>
      )}
      {data?.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "p-4 border-b border-border cursor-pointer transition-colors",
            "hover:bg-background/50",
            selectedChat === conversation.id && "bg-accent/10 border-r-2 border-r-accent"
          )}
          onClick={() => onChatSelect(conversation.id)}
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-gmail-blue to-gmail-red text-white">
                  MC
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium truncate">{conversation.subject || "Untitled conversation"}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conversation.id}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}