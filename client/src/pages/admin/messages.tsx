import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, Search, RefreshCw, ChevronRight, User, Clock, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalLayout } from "@/components/portal/portal-layout";
import { ChatPanel } from "@/components/admin/chat-panel";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ClientWithMessages {
  id: string;
  businessLegalName: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  lastMessage?: {
    id: string;
    messageText: string;
    senderType: "admin" | "client";
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  totalMessages: number;
}

export default function AdminMessages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  const { data: conversations = [], isLoading, refetch, isFetching } = useQuery<ClientWithMessages[]>({
    queryKey: ["/api/admin/messages/conversations"],
    refetchInterval: 10000,
  });

  const { data: unreadTotal } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/admin/messages/unread-total"],
    refetchInterval: 10000,
  });

  const filteredConversations = conversations.filter(client => 
    client.businessLegalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${client.user.firstName} ${client.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    }
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    return 0;
  });

  const handleSelectClient = (client: ClientWithMessages) => {
    setSelectedClientId(client.id);
    setSelectedClientName(`${client.user.firstName} ${client.user.lastName}`);
  };

  return (
    <PortalLayout requiredRole="admin">
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-80 border-r flex flex-col bg-background">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-semibold text-lg flex items-center gap-2" data-testid="text-page-title">
                <MessageCircle className="w-5 h-5" />
                Messages
                {unreadTotal && unreadTotal.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5">
                    {unreadTotal.unreadCount}
                  </Badge>
                )}
              </h1>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                data-testid="button-refresh-conversations"
              >
                <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-conversations"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedConversations.length > 0 ? (
                sortedConversations.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover-elevate",
                      selectedClientId === client.id && "bg-accent"
                    )}
                    data-testid={`conversation-${client.id}`}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {client.user.firstName[0]}{client.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {client.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                          {client.unreadCount > 9 ? "9+" : client.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "font-medium text-sm truncate",
                          client.unreadCount > 0 && "font-semibold"
                        )}>
                          {client.user.firstName} {client.user.lastName}
                        </span>
                        {client.lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(client.lastMessage.createdAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {client.businessLegalName}
                      </p>
                      {client.lastMessage && (
                        <p className={cn(
                          "text-xs truncate mt-0.5",
                          client.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {client.lastMessage.senderType === "admin" && (
                            <span className="text-muted-foreground">You: </span>
                          )}
                          {client.lastMessage.messageText}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No matching conversations" : "No conversations yet"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedClientId ? (
            <ChatPanel 
              clientId={selectedClientId}
              clientName={selectedClientName}
              className="h-full rounded-none border-0"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
                  }}
                >
                  <MessageCircle className="w-10 h-10 text-primary/60" />
                </div>
                <p className="font-medium text-foreground">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a client from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
