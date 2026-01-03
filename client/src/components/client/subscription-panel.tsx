import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  CreditCard,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SubscriptionInfo {
  projectId: string;
  subscriptionId: string;
  status: string;
  plan: string;
  monthlyFee: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionResponse {
  subscriptions: SubscriptionInfo[];
  disabled?: boolean;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const tierLabels: Record<string, string> = {
  standard: "Standard",
  business: "Business/Premium",
  ecommerce: "E-commerce",
};

export function ClientSubscriptionPanel() {
  const { toast } = useToast();

  const { data: subscriptionData, isLoading } = useQuery<SubscriptionResponse>({
    queryKey: ["/api/client/subscription"],
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/client/billing-portal");
      return response.json();
    },
    onSuccess: (data: { url: string }) => {
      window.open(data.url, "_blank");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return null;
  }

  // Don't show panel if Stripe is disabled
  if (subscriptionData?.disabled) {
    return null;
  }

  // Include all subscription states that require visibility:
  // - active/trialing: normal billing
  // - past_due/incomplete: client needs to fix payment
  // - unpaid: needs attention
  // - cancel_at_period_end subscriptions still need to be visible
  const visibleSubscriptions = subscriptionData?.subscriptions?.filter(
    (s) => ["active", "trialing", "past_due", "incomplete", "unpaid"].includes(s.status)
  ) || [];

  if (visibleSubscriptions.length === 0) {
    return null;
  }

  const subscription = visibleSubscriptions[0];

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
          Cancelling
        </Badge>
      );
    }
    switch (status) {
      case "active":
      case "trialing":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            Active
          </Badge>
        );
      case "past_due":
      case "incomplete":
      case "unpaid":
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
            Payment Required
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const needsPaymentAttention = ["past_due", "incomplete", "unpaid"].includes(subscription.status);

  return (
    <motion.div variants={fadeInUp}>
      <Card
        className={`overflow-hidden ${
          needsPaymentAttention
            ? "border-red-500/30 bg-gradient-to-br from-red-500/5 to-background"
            : "border-primary/20 bg-gradient-to-br from-primary/5 to-background"
        }`}
        data-testid="card-subscription"
      >
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  needsPaymentAttention ? "bg-red-500/10" : "bg-primary/10"
                }`}
                animate={needsPaymentAttention ? { scale: [1, 1.1, 1] } : { scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: needsPaymentAttention ? 1.5 : 3 }}
              >
                {needsPaymentAttention ? (
                  <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                ) : (
                  <CreditCard className="w-7 h-7 text-primary" />
                )}
              </motion.div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">Monthly Maintenance</h3>
                  {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {tierLabels[subscription.plan] || subscription.plan} Plan - ${subscription.monthlyFee}/month
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Next billing:{" "}
                  {format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => billingPortalMutation.mutate()}
                disabled={billingPortalMutation.isPending}
                className="gap-2"
                data-testid="button-billing-portal"
              >
                {billingPortalMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage Billing
              </Button>
            </div>
          </div>

          {needsPaymentAttention && (
            <motion.div
              className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                There's an issue with your payment method. Please click "Manage Billing" to update your payment information.
              </span>
            </motion.div>
          )}

          {subscription.cancelAtPeriodEnd && !needsPaymentAttention && (
            <motion.div
              className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Your subscription will cancel on{" "}
                {format(new Date(subscription.currentPeriodEnd), "MMMM d, yyyy")}.
                Contact us if you'd like to continue.
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
