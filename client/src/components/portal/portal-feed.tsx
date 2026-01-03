import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  AlertCircle,
  Info,
  Pin,
  Check,
  CheckCircle2,
  Eye,
  Plus,
  Send,
  Loader2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PortalItem } from "@shared/schema";

const itemTypeIcons: Record<string, any> = {
  payment_request: CreditCard,
  document: FileText,
  message: MessageSquare,
  action_required: AlertCircle,
  info: Info,
};

const itemTypeColors: Record<string, string> = {
  payment_request: "text-green-600 dark:text-green-400",
  document: "text-blue-600 dark:text-blue-400",
  message: "text-purple-600 dark:text-purple-400",
  action_required: "text-amber-600 dark:text-amber-400",
  info: "text-slate-600 dark:text-slate-400",
};

const itemTypeBadgeColors: Record<string, string> = {
  payment_request: "bg-green-500/10 text-green-600 dark:text-green-400",
  document: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  message: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  action_required: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const itemTypeLabels: Record<string, string> = {
  payment_request: "Payment Request",
  document: "Document",
  message: "Message",
  action_required: "Action Required",
  info: "Update",
};

interface PortalFeedProps {
  clientId?: string;
  isAdmin?: boolean;
}

export function PortalFeed({ clientId, isAdmin = false }: PortalFeedProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemType: "message" as string,
    title: "",
    description: "",
    isPinned: false,
    isUrgent: false,
  });

  const endpoint = isAdmin && clientId 
    ? `/api/admin/clients/${clientId}/portal-items`
    : "/api/client/portal-items";

  const { data: items = [], isLoading } = useQuery<PortalItem[]>({
    queryKey: [endpoint],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newItem) => {
      const res = await apiRequest("POST", endpoint, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setIsAddDialogOpen(false);
      setNewItem({
        itemType: "message",
        title: "",
        description: "",
        isPinned: false,
        isUrgent: false,
      });
      toast({
        title: "Item sent",
        description: "The item has been sent to the client's portal.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/client/portal-items/${id}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: () => {
      toast({
        title: "Failed to mark as read",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/client/portal-items/${id}/acknowledge`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({
        title: "Acknowledged",
        description: "Item has been marked as acknowledged.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to acknowledge",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const pinnedItems = items.filter(item => item.isPinned);
  const regularItems = items.filter(item => !item.isPinned);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Portal Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {isAdmin ? "Client Portal Feed" : "Your Updates"}
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? "Send updates, documents, and payment requests to this client"
              : "Important updates and items from your project team"}
          </CardDescription>
        </div>
        {isAdmin && clientId && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-portal-item">
                <Plus className="h-4 w-4 mr-2" />
                Push Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Item to Client</DialogTitle>
                <DialogDescription>
                  Create a new update that will appear in the client's portal feed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <Select
                    value={newItem.itemType}
                    onValueChange={(value) => setNewItem({ ...newItem, itemType: value })}
                  >
                    <SelectTrigger data-testid="select-item-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message">Message / Update</SelectItem>
                      <SelectItem value="payment_request">Payment Request</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="action_required">Action Required</SelectItem>
                      <SelectItem value="info">General Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    data-testid="input-item-title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Enter a title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    data-testid="input-item-description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Enter details..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPinned"
                      checked={newItem.isPinned}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, isPinned: checked })}
                    />
                    <Label htmlFor="isPinned" className="flex items-center gap-1">
                      <Pin className="h-4 w-4" />
                      Pin to top
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isUrgent"
                      checked={newItem.isUrgent}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, isUrgent: checked })}
                    />
                    <Label htmlFor="isUrgent" className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Mark urgent
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-testid="button-send-item"
                  onClick={() => createMutation.mutate(newItem)}
                  disabled={!newItem.title.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>{isAdmin ? "No items sent to this client yet" : "No updates yet"}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {pinnedItems.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Pin className="h-3 w-3" /> Pinned
                  </p>
                  {pinnedItems.map((item) => (
                    <PortalItemCard 
                      key={item.id} 
                      item={item} 
                      isAdmin={isAdmin}
                      onMarkRead={() => markReadMutation.mutate(item.id)}
                      onAcknowledge={() => acknowledgeMutation.mutate(item.id)}
                    />
                  ))}
                </div>
              )}
              {regularItems.map((item) => (
                <PortalItemCard 
                  key={item.id} 
                  item={item} 
                  isAdmin={isAdmin}
                  onMarkRead={() => markReadMutation.mutate(item.id)}
                  onAcknowledge={() => acknowledgeMutation.mutate(item.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface PortalItemCardProps {
  item: PortalItem;
  isAdmin: boolean;
  onMarkRead: () => void;
  onAcknowledge: () => void;
}

function PortalItemCard({ item, isAdmin, onMarkRead, onAcknowledge }: PortalItemCardProps) {
  const Icon = itemTypeIcons[item.itemType] || Info;
  const colorClass = itemTypeColors[item.itemType] || "text-slate-600";
  const badgeClass = itemTypeBadgeColors[item.itemType] || "bg-slate-500/10 text-slate-600";
  const label = itemTypeLabels[item.itemType] || "Update";

  return (
    <div 
      data-testid={`portal-item-${item.id}`}
      className={`p-4 rounded-lg border ${item.isUrgent ? 'border-amber-500/50 bg-amber-500/5' : 'border-border'} ${!item.isRead && !isAdmin ? 'bg-accent/30' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md bg-background ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium">{item.title}</span>
            <Badge variant="secondary" className={`text-xs ${badgeClass}`}>
              {label}
            </Badge>
            {item.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
            {item.isAcknowledged && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Acknowledged
              </Badge>
            )}
            {item.isRead && !item.isAcknowledged && !isAdmin && (
              <Badge variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Read
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(item.createdAt!), { addSuffix: true })}
            </span>
            {isAdmin && (
              <>
                {item.isRead && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Eye className="h-3 w-3" />
                    Read {item.readAt && format(new Date(item.readAt), "MMM d")}
                  </span>
                )}
                {item.isAcknowledged && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-3 w-3" />
                    Acknowledged {item.acknowledgedAt && format(new Date(item.acknowledgedAt), "MMM d")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {!isAdmin && !item.isAcknowledged && (item.itemType === "action_required" || item.itemType === "payment_request") && (
          <div className="flex flex-col gap-1">
            {!item.isRead && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onMarkRead}
                data-testid={`button-mark-read-${item.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={onAcknowledge}
              data-testid={`button-acknowledge-${item.id}`}
            >
              <Check className="h-4 w-4 mr-1" />
              Ack
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
