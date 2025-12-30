import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, MessageCircle, Loader2, User, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  } else {
    return format(date, "MMM d, h:mm a");
  }
}

export default function ClientMessages() {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              Messages
            </h1>
            <p className="text-muted-foreground mt-1">
              Chat with the ML WebDesign team
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-messages"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <Card className="border-border/50 flex flex-col h-[calc(100vh-220px)]">
          <CardHeader className="border-b py-3">
            <CardTitle className="font-serif text-lg flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span>Project Discussion</span>
                <p className="text-sm font-normal text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1">
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
                      const isOwnMessage = message.senderType === "client";
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
                              isOwnMessage ? "flex-row-reverse" : "flex-row"
                            )}
                            data-testid={`message-item-${message.id}`}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                              isOwnMessage ? "bg-primary/10" : "bg-muted"
                            )}>
                              {isOwnMessage ? (
                                <User className="w-4 h-4 text-primary" />
                              ) : (
                                <Users className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "items-end" : "items-start")}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {isOwnMessage ? "You" : (message.sender?.firstName ? `${message.sender.firstName}` : "Team")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(new Date(message.createdAt))}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-2.5",
                                  isOwnMessage
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-muted rounded-tl-sm"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {message.messageText}
                                </p>
                              </div>
                              {isOwnMessage && message.isRead && (
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
                  <div className="h-full flex items-center justify-center text-center py-12">
                    <div>
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Send a message to start the conversation
                      </p>
                    </div>
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
                  data-testid="input-message"
                />
                <Button 
                  type="submit" 
                  size="icon"
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
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
