import { useLocation } from "wouter";
import { XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalLayout } from "@/components/portal/portal-layout";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <PortalLayout requiredRole="client">
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center border-border/50">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="font-serif text-2xl" data-testid="text-cancel-title">
              Payment Cancelled
            </CardTitle>
            <CardDescription>
              Your payment was not completed. No charges have been made to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you experienced any issues or have questions, please contact us.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setLocation("/client/payments")}
                data-testid="button-try-again"
              >
                Try Again
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
