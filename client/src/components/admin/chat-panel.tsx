import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, MessageCircle, Loader2, User, RefreshCw, CheckCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
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
  return format(date, "h:mm a");
}

function formatDateDivider(date: Date): string {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "EEEE, MMMM d");
  }
}

export function ChatPanel({ clientId, clientName, projectId, className }: ChatPanelProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, refetch, isFetching } = useQuery<Message[]>({
    queryKey: ["/api/admin/clients", clientId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
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
    <div className={cn("flex flex-col h-full bg-background rounded-lg border overflow-hidden", className)}>
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {clientName?.[0] || "C"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate" data-testid="text-chat-title">
            {clientName || "Client"}
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
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-4 space-y-1">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "justify-end" : "")}>
                  <Skeleton className="h-12 w-48 rounded-2xl" />
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
                
                const isLastInGroup = index === messages.length - 1 || 
                  messages[index + 1].senderType !== message.senderType ||
                  new Date(messages[index + 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 60000;

                return (
                  <div key={message.id}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                          {formatDateDivider(new Date(message.createdAt))}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex gap-2 mb-0.5",
                        isAdmin ? "flex-row-reverse" : "flex-row"
                      )}
                      data-testid={`message-item-${message.id}`}
                    >
                      {!isAdmin && isLastInGroup && (
                        <Avatar className="w-6 h-6 mt-auto">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {message.senderName?.[0] || "C"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isAdmin && !isLastInGroup && (
                        <div className="w-6 shrink-0" />
                      )}
                      <div className={cn("flex flex-col max-w-[80%]", isAdmin ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "px-3 py-2 shadow-sm",
                            isAdmin
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-muted rounded-2xl rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.messageText}
                          </p>
                        </div>
                        {isLastInGroup && (
                          <div className={cn(
                            "flex items-center gap-1 mt-0.5 px-1",
                            isAdmin ? "flex-row-reverse" : "flex-row"
                          )}>
                            <span className="text-[10px] text-muted-foreground">
                              {formatMessageTime(new Date(message.createdAt))}
                            </span>
                            {isAdmin && message.isRead && (
                              <CheckCheck className="w-3 h-3 text-primary" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-2" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
                }}
              >
                <MessageCircle className="w-7 h-7 text-primary/60" />
              </div>
              <p className="text-muted-foreground font-medium text-sm">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a conversation with this client
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t bg-muted/10">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[40px] max-h-24 text-sm rounded-xl"
            rows={1}
            data-testid="input-admin-message"
          />
          <Button 
            type="submit" 
            size="icon"
            className="rounded-full shrink-0"
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
      </form>
    </div>
  );
}
