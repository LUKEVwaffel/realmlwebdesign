import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, MessageCircle, Loader2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  clientId: string;
  projectId?: string;
  senderId: string;
  senderType: "admin" | "client";
  senderName: string;
  messageText: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface ChatPanelProps {
  clientId: string;
  clientName?: string;
  projectId?: string;
  className?: string;
}

function formatMessageTime(date: Date): string {
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  } else {
    return format(date, "MMM d, h:mm a");
  }
}

export function ChatPanel({ clientId, clientName, projectId, className }: ChatPanelProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, refetch } = useQuery<Message[]>({
    queryKey: ["/api/admin/clients", clientId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest("POST", `/api/admin/clients/${clientId}/messages`, { 
        messageText,
        projectId,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId, "messages"] });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        sendMutation.mutate(newMessage.trim());
      }
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background rounded-lg border", className)}>
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate" data-testid="text-chat-title">
            {clientName ? `Chat with ${clientName}` : "Messages"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => refetch()}
          data-testid="button-refresh-messages"
        >
          <Loader2 className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "justify-end" : "")}>
                  <Skeleton className="h-12 w-48 rounded-lg" />
                </div>
              ))}
            </div>
          ) : messages.length > 0 ? (
            <>
              {messages.map((message, index) => {
                const isAdmin = message.senderType === "admin";
                const showDateDivider = index === 0 || 
                  new Date(message.createdAt).toDateString() !== 
                  new Date(messages[index - 1].createdAt).toDateString();

                return (
                  <div key={message.id}>
                    {showDateDivider && (
                      <div className="flex items-center gap-2 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground px-2">
                          {isToday(new Date(message.createdAt)) 
                            ? "Today" 
                            : isYesterday(new Date(message.createdAt))
                            ? "Yesterday"
                            : format(new Date(message.createdAt), "MMMM d, yyyy")}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex gap-2",
                        isAdmin ? "flex-row-reverse" : "flex-row"
                      )}
                      data-testid={`message-item-${message.id}`}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                        isAdmin ? "bg-primary/10" : "bg-muted"
                      )}>
                        {isAdmin ? (
                          <Users className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className={cn("flex flex-col max-w-[75%]", isAdmin ? "items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(new Date(message.createdAt))}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5",
                            isAdmin
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.messageText}
                          </p>
                        </div>
                        {isAdmin && message.isRead && (
                          <span className="text-[10px] text-muted-foreground mt-1">
                            Read {message.readAt ? formatDistanceToNow(new Date(message.readAt), { addSuffix: true }) : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start the conversation with this client
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t bg-muted/20">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[48px] max-h-32 text-sm"
            rows={1}
            data-testid="input-admin-message"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || sendMutation.isPending}
            data-testid="button-send-admin-message"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
