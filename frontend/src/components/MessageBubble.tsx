import { cn } from "@/lib/utils";
import { Check, CheckCheck, FileText, Image, Music, Video } from "lucide-react";

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

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
      case 'read':
        return <CheckCheck className={cn("h-3 w-3", status === 'read' && "text-primary")} />;
      default:
        return null;
    }
  };

  const getFileIcon = (type: FileAttachment['type']) => {
    switch (type) {
      case 'image': return Image;
      case 'document': return FileText;
      case 'audio': return Music;
      case 'video': return Video;
      default: return FileText;
    }
  };

  return (
    <div className={cn("flex", message.isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative group", {
        "bg-message-sent text-white": message.isOwn,
        "bg-message-received text-foreground": !message.isOwn,
      })}>
        {/* File attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 space-y-2">
            {message.attachments.map((attachment, index) => {
              const Icon = getFileIcon(attachment.type);
              
              return (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-black/10">
                  {attachment.type === 'image' ? (
                    <img 
                      src={attachment.url} 
                      alt={attachment.file.name}
                      className="max-w-48 max-h-48 object-cover rounded"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{attachment.file.name}</p>
                        <p className="text-xs opacity-70">
                          {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
        
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs opacity-70",
          message.isOwn ? "justify-end" : "justify-start"
        )}>
          <span>{formatTime(message.timestamp)}</span>
          {message.isOwn && getStatusIcon(message.status)}
        </div>
        
        {/* Message tail */}
        <div className={cn(
          "absolute top-2 w-2 h-2 rotate-45",
          message.isOwn 
            ? "right-[-4px] bg-message-sent" 
            : "left-[-4px] bg-message-received"
        )} />
      </div>
    </div>
  );
}