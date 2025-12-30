import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, MessageCircle, Loader2, User, Sparkles, RefreshCw, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PortalLayout } from "@/components/portal/portal-layout";
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
  messageText: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
  };
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

export default function ClientMessages() {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, refetch, isFetching } = useQuery<Message[]>({
    queryKey: ["/api/client/messages"],
    refetchInterval: 5000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/client/messages/mark-read"),
  });

  useEffect(() => {
    if (messages.length > 0) {
      markReadMutation.mutate();
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest("POST", "/api/client/messages", { messageText });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages/unread"] });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Please try again later.",
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
    <PortalLayout requiredRole="client">
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg" data-testid="text-page-title">
                ML WebDesign Team
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Usually responds within minutes
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-messages"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </Button>
        </div>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-1 min-h-full">
            {isLoading ? (
              <div className="space-y-4 py-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "justify-end" : "")}>
                    <Skeleton className="h-14 w-56 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderType === "client";
                  const showDateDivider = index === 0 || 
                    new Date(message.createdAt).toDateString() !== 
                    new Date(messages[index - 1].createdAt).toDateString();
                  
                  const isLastInGroup = index === messages.length - 1 || 
                    messages[index + 1].senderType !== message.senderType ||
                    new Date(messages[index + 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 60000;

                  return (
                    <div key={message.id}>
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-6">
                          <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                            {formatDateDivider(new Date(message.createdAt))}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex gap-2 mb-0.5",
                          isOwnMessage ? "flex-row-reverse" : "flex-row"
                        )}
                        data-testid={`message-item-${message.id}`}
                      >
                        {!isOwnMessage && isLastInGroup && (
                          <Avatar className="w-7 h-7 mt-auto">
                            <AvatarFallback 
                              className="text-[10px] font-medium"
                              style={{
                                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
                                color: 'white',
                              }}
                            >
                              {message.sender?.firstName?.[0] || "M"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {!isOwnMessage && !isLastInGroup && (
                          <div className="w-7 shrink-0" />
                        )}
                        <div className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "items-end" : "items-start")}>
                          <div
                            className={cn(
                              "px-4 py-2.5 shadow-sm",
                              isOwnMessage
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                                : "bg-card border border-border/50 rounded-2xl rounded-bl-md"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.messageText}
                            </p>
                          </div>
                          {isLastInGroup && (
                            <div className={cn(
                              "flex items-center gap-1 mt-1 px-1",
                              isOwnMessage ? "flex-row-reverse" : "flex-row"
                            )}>
                              <span className="text-[10px] text-muted-foreground">
                                {formatMessageTime(new Date(message.createdAt))}
                              </span>
                              {isOwnMessage && message.isRead && (
                                <CheckCheck className="w-3 h-3 text-primary" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-16">
                <div>
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
                    }}
                  >
                    <MessageCircle className="w-10 h-10 text-primary/60" />
                  </div>
                  <p className="font-medium text-foreground">Start a conversation</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                    Send us a message and we'll get back to you as soon as possible
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-background p-3">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="resize-none min-h-[44px] max-h-32 pr-12 text-sm rounded-2xl"
                  rows={1}
                  data-testid="input-message"
                />
              </div>
              <Button 
                type="submit" 
                size="icon"
                className="rounded-full shrink-0"
                disabled={!newMessage.trim() || sendMutation.isPending}
                data-testid="button-send-message"
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
      </div>
    </PortalLayout>
  );
}
