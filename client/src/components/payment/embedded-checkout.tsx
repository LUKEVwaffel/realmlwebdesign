import { useState, useEffect, useRef, useCallback } from "react";
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

let stripePromise: Promise<Stripe | null> | null = null;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    const response = await fetch("/api/stripe/publishable-key", {
      credentials: "include",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to get Stripe configuration");
    }
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface EmbeddedCheckoutProps {
  paymentId: string;
  amount: string;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmbeddedCheckout({ paymentId, amount, description, onSuccess, onCancel }: EmbeddedCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "succeeded" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const paymentElementRef = useRef<HTMLDivElement>(null);
  const paymentElementInstance = useRef<StripePaymentElement | null>(null);
  const elementsInstance = useRef<StripeElements | null>(null);
  const isMounted = useRef(true);

  const cleanupStripeElement = useCallback(() => {
    if (paymentElementInstance.current) {
      try {
        paymentElementInstance.current.unmount();
      } catch (e) {
      }
      paymentElementInstance.current = null;
    }
    elementsInstance.current = null;
    setElements(null);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    const initializePayment = async () => {
      try {
        const stripeInst = await getStripePromise();
        if (!isMounted.current) return;
        
        if (!stripeInst) {
          setError("Failed to load payment system");
          setIsLoading(false);
          return;
        }
        setStripe(stripeInst);

        const response = await apiRequest("POST", `/api/payments/${paymentId}/create-payment-intent`);
        if (!isMounted.current) return;
        
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Failed to initialize payment");
        }
      } catch (err: any) {
        if (isMounted.current) {
          setError(err.message || "Failed to initialize payment");
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    initializePayment();

    return () => {
      isMounted.current = false;
      cleanupStripeElement();
    };
  }, [paymentId, cleanupStripeElement]);

  useEffect(() => {
    if (stripe && clientSecret && paymentElementRef.current && !elementsInstance.current) {
      const isDark = document.documentElement.classList.contains("dark");
      const newElements = stripe.elements({
        clientSecret,
        appearance: {
          theme: isDark ? "night" : "stripe",
          variables: {
            colorPrimary: "#6366f1",
            borderRadius: "8px",
          },
        },
      });
      
      const paymentElement = newElements.create("payment", {
        layout: "tabs",
      });
      
      paymentElement.mount(paymentElementRef.current);
      paymentElementInstance.current = paymentElement;
      elementsInstance.current = newElements;
      setElements(newElements);
    }
  }, [stripe, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setErrorMessage(submitError.message || "An error occurred");
        setPaymentStatus("failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          await apiRequest("POST", `/api/payments/${paymentId}/confirm-payment`, {
            paymentIntentId: paymentIntent.id,
          });
          setPaymentStatus("succeeded");
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else if (paymentIntent.status === "requires_action") {
          const { error: actionError, paymentIntent: confirmedIntent } = await stripe.handleNextAction({
            clientSecret: clientSecret!,
          });
          
          if (actionError) {
            setErrorMessage(actionError.message || "Payment verification failed");
            setPaymentStatus("failed");
          } else if (confirmedIntent && confirmedIntent.status === "succeeded") {
            await apiRequest("POST", `/api/payments/${paymentId}/confirm-payment`, {
              paymentIntentId: confirmedIntent.id,
            });
            setPaymentStatus("succeeded");
            setTimeout(() => {
              onSuccess();
            }, 2000);
          } else {
            setErrorMessage("Payment could not be completed. Please try again.");
            setPaymentStatus("failed");
          }
        } else if (paymentIntent.status === "processing") {
          setErrorMessage("Payment is processing. Please wait...");
        } else {
          setErrorMessage("Payment could not be completed. Please try again.");
          setPaymentStatus("failed");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment failed. Please try again.");
      setPaymentStatus("failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = useCallback(() => {
    cleanupStripeElement();
    onCancel();
  }, [cleanupStripeElement, onCancel]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Setting up payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-destructive text-center">{error}</p>
            <Button variant="outline" onClick={handleCancel}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === "succeeded") {
    return (
      <Card className="w-full max-w-md mx-auto border-border/50">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful</h3>
            <p className="text-muted-foreground">
              Your payment of ${parseFloat(amount).toLocaleString()} has been processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-border/50">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={handleCancel}
          data-testid="button-close-checkout"
        >
          <X className="w-4 h-4" />
        </Button>
        <CardTitle className="font-serif">Secure Payment</CardTitle>
        <CardDescription>Complete your payment securely</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono text-xl font-bold">${parseFloat(amount).toLocaleString()}</span>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            )}
          </div>

          <div 
            ref={paymentElementRef} 
            className="min-h-[200px]"
            data-testid="stripe-payment-element"
          />

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1"
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || !elements || isProcessing}
              className="flex-1"
              data-testid="button-confirm-payment"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ${parseFloat(amount).toLocaleString()}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
