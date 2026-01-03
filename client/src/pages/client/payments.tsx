import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreditCard, Download, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { PortalLayout } from "@/components/portal/portal-layout";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EmbeddedCheckout } from "@/components/payment/embedded-checkout";
import { ClientSubscriptionPanel } from "@/components/client/subscription-panel";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function downloadInvoice(paymentId: string, token: string) {
  const url = `/api/payments/${paymentId}/invoice`;
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to download invoice");
      return res.blob();
    })
    .then((blob) => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch((err) => console.error("Download error:", err));
}

const paymentStatusStyles: Record<string, { bg: string; icon: any }> = {
  pending: { bg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", icon: Clock },
  paid: { bg: "bg-green-500/10 text-green-600 dark:text-green-400", icon: CheckCircle2 },
  overdue: { bg: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertCircle },
  cancelled: { bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400", icon: null },
};

export default function ClientPayments() {
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string;
    amount: string;
    description: string;
  } | null>(null);
  
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["/api/client/payments"],
  });

  const handlePayNow = (payment: any) => {
    setSelectedPayment({
      id: payment.id,
      amount: payment.amount,
      description: payment.description || `Payment #${payment.paymentNumber}`,
    });
  };

  const handlePaymentSuccess = () => {
    setSelectedPayment(null);
    queryClient.invalidateQueries({ queryKey: ["/api/client/payments"] });
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed successfully.",
    });
  };

  const handlePaymentCancel = () => {
    setSelectedPayment(null);
  };

  const payments = (Array.isArray(paymentsData) ? paymentsData : paymentsData?.payments) || [];
  const totalPaid = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
  const totalPending = payments
    .filter((p: any) => p.status === "pending" || p.status === "overdue")
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  return (
    <PortalLayout requiredRole="client">
      <motion.div 
        className="p-6 space-y-6 max-w-6xl mx-auto"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp}>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-payments-title">
            Payments
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your project payments and invoices
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="font-serif text-2xl font-bold" data-testid="text-total-paid">
                    ${totalPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="font-serif text-2xl font-bold" data-testid="text-total-pending">
                    ${totalPending.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="font-serif text-2xl font-bold" data-testid="text-total-count">
                    {payments.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Subscription */}
        <ClientSubscriptionPanel />

        {/* Payments Table */}
        <Card className="border-border/50" data-testid="card-payments-table">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Payment History</CardTitle>
            <CardDescription>All your project payments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => {
                      const statusStyle = paymentStatusStyles[payment.status] || paymentStatusStyles.pending;
                      const StatusIcon = statusStyle.icon;
                      
                      return (
                        <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                          <TableCell className="font-medium">
                            #{payment.paymentNumber}
                          </TableCell>
                          <TableCell>{payment.description || "Project Payment"}</TableCell>
                          <TableCell className="font-mono">
                            ${parseFloat(payment.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {payment.dueDate
                              ? format(new Date(payment.dueDate), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusStyle.bg}>
                              {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(payment.status === "pending" || payment.status === "overdue") && (
                                <Button 
                                  size="sm" 
                                  data-testid={`button-pay-${payment.id}`}
                                  onClick={() => handlePayNow(payment)}
                                >
                                  Pay Now
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-download-${payment.id}`}
                                onClick={() => {
                                  const token = localStorage.getItem("token");
                                  if (token) downloadInvoice(payment.id, token);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No payments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {selectedPayment && (
        <Dialog open={true} onOpenChange={(open) => !open && handlePaymentCancel()}>
          <DialogContent className="sm:max-w-lg p-0 border-0 bg-transparent shadow-none">
            <EmbeddedCheckout
              key={selectedPayment.id}
              paymentId={selectedPayment.id}
              amount={selectedPayment.amount}
              description={selectedPayment.description}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </PortalLayout>
  );
}
