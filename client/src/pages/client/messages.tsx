import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function ClientMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/client/messages"],
  });

  const sendMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest("/api/client/messages", {
        method: "POST",
        body: JSON.stringify({ messageText }),
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent to the team.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  return (
    <PortalLayout requiredRole="client">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Communicate with our design team
          </p>
        </div>

        <Card className="border-border/50 flex flex-col h-[calc(100vh-220px)]">
          <CardHeader className="border-b">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Project Discussion
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-16 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message: any) => {
                    const isOwnMessage = message.senderType === "client";
                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                        data-testid={`message-item-${message.id}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {isOwnMessage ? "You" : message.sender?.firstName || "Team"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.messageText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center py-12">
                  <div>
                    <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="resize-none min-h-[60px]"
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
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
