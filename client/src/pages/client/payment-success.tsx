import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalLayout } from "@/components/portal/portal-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const paymentId = params.get("payment_id");

    if (sessionId && paymentId) {
      apiRequest("POST", "/api/payments/verify-session", { sessionId, paymentId })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Verification failed");
          }
          return res.json();
        })
        .then(data => {
          setVerified(data.verified);
          setVerifying(false);
          queryClient.invalidateQueries({ queryKey: ["/api/client/payments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/client/dashboard"] });
        })
        .catch((err) => {
          setError(err.message || "Unable to verify payment");
          setVerifying(false);
        });
    } else {
      setError("Missing payment information");
      setVerifying(false);
    }
  }, []);

  if (verifying) {
    return (
      <PortalLayout requiredRole="client">
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center border-border/50">
            <CardContent className="py-12">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Verifying payment...</p>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout requiredRole="client">
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center border-border/50">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="font-serif text-2xl" data-testid="text-error-title">
                Verification Issue
              </CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you completed your payment, it may take a moment to process. Please check your payments page.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => setLocation("/client/payments")}
                  data-testid="button-view-payments-error"
                >
                  View All Payments
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/client/dashboard")}
                  data-testid="button-back-dashboard-error"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout requiredRole="client">
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center border-border/50">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="font-serif text-2xl" data-testid="text-success-title">
              {verified ? "Payment Successful" : "Payment Processing"}
            </CardTitle>
            <CardDescription>
              {verified 
                ? "Thank you for your payment. Your transaction has been completed successfully."
                : "Your payment is being processed. Please check back shortly."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A confirmation email will be sent to you shortly with the receipt details.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setLocation("/client/payments")}
                data-testid="button-view-payments"
              >
                View All Payments
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/client/dashboard")}
                data-testid="button-back-dashboard"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
