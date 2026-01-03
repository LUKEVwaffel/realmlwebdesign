import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Square,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MaintenanceSubscriptionProps {
  projectId: string;
  projectStatus?: string;
}

interface MaintenanceProduct {
  product_id: string;
  product_name: string;
  product_description: string;
  product_metadata: { tier?: string };
  price_id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string };
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscriptionId?: string;
  status?: string;
  stripeSubscriptionStatus?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  maintenancePlan?: string;
  maintenanceStatus?: string;
  monthlyFee?: string;
  monthsCompleted?: number;
  minimumMonths?: number;
}

export function MaintenanceSubscription({ projectId, projectStatus }: MaintenanceSubscriptionProps) {
  const { toast } = useToast();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ priceId: string; tier: string } | null>(null);
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [applyTerminationFee, setApplyTerminationFee] = useState(true);

  const { data: products, isLoading: productsLoading } = useQuery<{ products: MaintenanceProduct[] }>({
    queryKey: ["/api/admin/maintenance-products"],
  });

  const { data: subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/admin/projects", projectId, "subscription"],
  });

  const startSubscriptionMutation = useMutation({
    mutationFn: async (data: { priceId: string; tier: string }) => {
      return apiRequest("POST", `/api/admin/projects/${projectId}/start-maintenance`, data);
    },
    onSuccess: () => {
      toast({
        title: "Subscription Started",
        description: "Monthly maintenance subscription has been activated.",
      });
      setIsStartDialogOpen(false);
      setSelectedPlan(null);
      refetchSubscription();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start subscription",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (data: { cancelImmediately: boolean; applyTerminationFee: boolean }) => {
      return apiRequest("POST", `/api/admin/projects/${projectId}/cancel-maintenance`, data);
    },
    onSuccess: (data: any) => {
      const feeMessage = data.terminationFee 
        ? ` An early termination fee of $${data.terminationFee.toFixed(2)} has been applied.`
        : "";
      toast({
        title: "Subscription Cancelled",
        description: `Maintenance subscription has been cancelled.${feeMessage}`,
      });
      setIsCancelDialogOpen(false);
      refetchSubscription();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleStartSubscription = () => {
    if (!selectedPlan) {
      toast({
        title: "Select a Plan",
        description: "Please select a maintenance plan before starting.",
        variant: "destructive",
      });
      return;
    }
    startSubscriptionMutation.mutate(selectedPlan);
  };

  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate({
      cancelImmediately,
      applyTerminationFee,
    });
  };

  const isLoading = productsLoading || subscriptionLoading;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Active</Badge>;
      case "past_due":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">Past Due</Badge>;
      case "canceled":
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">Cancelled</Badge>;
      case "cancel_at_period_end":
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">Cancelling</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const tierLabels: Record<string, string> = {
    standard: "Standard ($50/mo)",
    business: "Business/Premium ($100/mo)",
    ecommerce: "E-commerce ($200/mo)",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Maintenance Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActiveSubscription = subscription?.hasSubscription && 
    subscription.status !== "canceled" && 
    subscription.maintenanceStatus !== "cancelled";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Maintenance Subscription
          </CardTitle>
          <CardDescription>
            Monthly website maintenance with 12-month commitment
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveSubscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tierLabels[subscription?.maintenancePlan || ""] || subscription?.maintenancePlan}</span>
                  {getStatusBadge(subscription?.stripeSubscriptionStatus || subscription?.status || subscription?.maintenanceStatus || "active")}
                </div>
                <p className="text-sm text-muted-foreground">
                  ${subscription?.monthlyFee || "0"}/month
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {subscription?.monthsCompleted || 0} / {subscription?.minimumMonths || 12} months
                </p>
                <p className="text-xs text-muted-foreground">commitment progress</p>
              </div>
            </div>

            {subscription?.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Next billing: {format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}
              </div>
            )}

            {subscription?.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Subscription will cancel at period end</span>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <Button
                variant="destructive"
                onClick={() => setIsCancelDialogOpen(true)}
                disabled={cancelSubscriptionMutation.isPending}
                data-testid="button-cancel-maintenance"
              >
                <Square className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {subscription?.maintenanceStatus === "cancelled" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">Previous subscription was cancelled</span>
              </div>
            )}

            <div className="p-4 rounded-lg border border-dashed flex flex-col items-center gap-4 py-8">
              <div className="text-center space-y-1">
                <p className="font-medium">No Active Maintenance Plan</p>
                <p className="text-sm text-muted-foreground">
                  Start a maintenance subscription for automatic monthly billing
                </p>
              </div>
              <Button
                onClick={() => setIsStartDialogOpen(true)}
                className="gap-2"
                data-testid="button-start-maintenance"
              >
                <Play className="w-4 h-4" />
                Start Maintenance Plan
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Maintenance Subscription</DialogTitle>
            <DialogDescription>
              Select a maintenance plan. All plans require a 12-month minimum commitment.
              Early cancellation incurs a 50% fee on remaining months.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select
                value={selectedPlan?.priceId || ""}
                onValueChange={(priceId) => {
                  const product = products?.products.find((p) => p.price_id === priceId);
                  if (product) {
                    setSelectedPlan({
                      priceId,
                      tier: product.product_metadata?.tier || "",
                    });
                  }
                }}
              >
                <SelectTrigger data-testid="select-maintenance-plan">
                  <SelectValue placeholder="Choose a maintenance plan..." />
                </SelectTrigger>
                <SelectContent>
                  {products?.products.map((product) => (
                    <SelectItem key={product.price_id} value={product.price_id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{product.product_name}</span>
                        <span className="text-muted-foreground">
                          ${((product.unit_amount || 0) / 100).toFixed(0)}/mo
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly fee:</span>
                  <span className="font-medium">
                    ${((products?.products.find((p) => p.price_id === selectedPlan.priceId)?.unit_amount || 0) / 100).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Commitment:</span>
                  <span className="font-medium">12 months</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total minimum:</span>
                  <span className="font-medium">
                    ${(((products?.products.find((p) => p.price_id === selectedPlan.priceId)?.unit_amount || 0) / 100) * 12).toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartSubscription}
              disabled={!selectedPlan || startSubscriptionMutation.isPending}
              data-testid="button-confirm-start-maintenance"
            >
              {startSubscriptionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Maintenance Subscription</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Are you sure you want to cancel this maintenance subscription?</p>
              
              {subscription && (subscription.monthsCompleted || 0) < (subscription.minimumMonths || 12) && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    Early Termination Warning
                  </div>
                  <p className="mt-1">
                    Client has completed {subscription.monthsCompleted || 0} of {subscription.minimumMonths || 12} months.
                    {applyTerminationFee && (
                      <> A 50% early termination fee of approximately ${(
                        ((subscription.minimumMonths || 12) - (subscription.monthsCompleted || 0)) *
                        parseFloat(subscription.monthlyFee || "0") * 0.5
                      ).toFixed(2)} will be applied.</>
                    )}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cancel Immediately</Label>
                <p className="text-xs text-muted-foreground">
                  End subscription now instead of at period end
                </p>
              </div>
              <Switch
                checked={cancelImmediately}
                onCheckedChange={setCancelImmediately}
                data-testid="switch-cancel-immediately"
              />
            </div>
            
            {subscription && (subscription.monthsCompleted || 0) < (subscription.minimumMonths || 12) && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Apply Termination Fee</Label>
                  <p className="text-xs text-muted-foreground">
                    Charge 50% of remaining commitment
                  </p>
                </div>
                <Switch
                  checked={applyTerminationFee}
                  onCheckedChange={setApplyTerminationFee}
                  data-testid="switch-apply-fee"
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-cancel-maintenance"
            >
              {cancelSubscriptionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
