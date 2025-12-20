import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Check, X, Clock, Eye, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PortalLayout } from "@/components/portal/portal-layout";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const quoteStatusStyles: Record<string, { bg: string; icon: any; label: string }> = {
  draft: { bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400", icon: Clock, label: "Draft" },
  sent: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: FileText, label: "Pending Review" },
  viewed: { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: Eye, label: "Viewed" },
  approved: { bg: "bg-green-500/10 text-green-600 dark:text-green-400", icon: Check, label: "Approved" },
  rejected: { bg: "bg-red-500/10 text-red-600 dark:text-red-400", icon: X, label: "Rejected" },
  expired: { bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400", icon: AlertCircle, label: "Expired" },
};

const formatCurrency = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return "0.00";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

export default function ClientQuotes() {
  const { toast } = useToast();
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const { data: quotes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/client/quotes"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ quoteId, response, message }: { quoteId: string; response: string; message: string }) => {
      const res = await apiRequest("POST", `/api/client/quotes/${quoteId}/respond`, { response, message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/quotes"] });
      setSelectedQuote(null);
      setResponseText("");
      toast({
        title: isApproving ? "Quote Approved" : "Quote Rejected",
        description: isApproving 
          ? "You have approved this quote. The team will be in touch shortly."
          : "You have declined this quote.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewQuote = (quote: any) => {
    setSelectedQuote(quote);
    setResponseText("");
  };

  const handleRespond = (approve: boolean) => {
    if (!selectedQuote) return;
    setIsApproving(approve);
    respondMutation.mutate({
      quoteId: selectedQuote.id,
      response: approve ? "approved" : "rejected",
      message: responseText,
    });
  };

  const pendingQuotes = (quotes || []).filter((q: any) => q.status === "sent" || q.status === "viewed");
  const respondedQuotes = (quotes || []).filter((q: any) => q.status === "approved" || q.status === "rejected");

  return (
    <PortalLayout requiredRole="client">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-quotes-title">
            Quotes
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and respond to pricing proposals from our team
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="text-pending-count">{pendingQuotes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Responded</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="text-responded-count">{respondedQuotes.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Your Quotes
            </CardTitle>
            <CardDescription>
              Click on a quote to view details and respond
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : quotes && quotes.length > 0 ? (
              <div className="space-y-4">
                {quotes.map((quote: any) => {
                  const style = quoteStatusStyles[quote.status] || quoteStatusStyles.sent;
                  const StatusIcon = style.icon;
                  const lineItems = typeof quote.lineItems === 'string' ? JSON.parse(quote.lineItems) : quote.lineItems;
                  
                  return (
                    <div
                      key={quote.id}
                      className="p-4 rounded-lg border hover-elevate cursor-pointer"
                      onClick={() => handleViewQuote(quote)}
                      data-testid={`quote-card-${quote.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-lg">{quote.title}</p>
                            <Badge className={style.bg}>
                              {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                              {style.label}
                            </Badge>
                          </div>
                          {quote.description && (
                            <p className="text-sm text-muted-foreground mt-1">{quote.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{lineItems?.length || 0} line items</span>
                            {quote.validUntil && (
                              <span>Valid until {format(new Date(quote.validUntil), "MMM d, yyyy")}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${quote.totalAmount}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(quote.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No quotes available</p>
                <p className="text-sm text-muted-foreground">When our team sends you a quote, it will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedQuote && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">{selectedQuote.title}</DialogTitle>
                  <DialogDescription>
                    {selectedQuote.description || "Review the details below and respond to this quote"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className={quoteStatusStyles[selectedQuote.status]?.bg || "bg-gray-500/10"}>
                      {quoteStatusStyles[selectedQuote.status]?.label || selectedQuote.status}
                    </Badge>
                    {selectedQuote.validUntil && (
                      <span className="text-sm text-muted-foreground">
                        Valid until {format(new Date(selectedQuote.validUntil), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Item</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Qty</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Price</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(typeof selectedQuote.lineItems === 'string' 
                          ? JSON.parse(selectedQuote.lineItems) 
                          : selectedQuote.lineItems
                        )?.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-3">
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">${formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              ${formatCurrency(item.quantity * (typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${formatCurrency(selectedQuote.subtotal)}</span>
                    </div>
                    {(parseFloat(selectedQuote.discountAmount) || 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount{selectedQuote.discountDescription && ` (${selectedQuote.discountDescription})`}:</span>
                        <span>-${formatCurrency(selectedQuote.discountAmount)}</span>
                      </div>
                    )}
                    {(parseFloat(selectedQuote.taxRate) || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax ({selectedQuote.taxRate}%):</span>
                        <span>${formatCurrency(selectedQuote.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${formatCurrency(selectedQuote.totalAmount)}</span>
                    </div>
                  </div>

                  {selectedQuote.notes && (
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{selectedQuote.notes}</p>
                    </div>
                  )}

                  {selectedQuote.termsAndConditions && (
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm font-medium mb-1">Terms and Conditions</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedQuote.termsAndConditions}</p>
                    </div>
                  )}

                  {selectedQuote.clientResponse && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-1">Your Response</p>
                      <p className="text-sm text-muted-foreground">{selectedQuote.clientResponse}</p>
                    </div>
                  )}

                  {(selectedQuote.status === "sent" || selectedQuote.status === "viewed") && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Your Response (optional)</Label>
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Add any comments or questions..."
                          rows={3}
                          data-testid="input-quote-response"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => handleRespond(true)}
                          disabled={respondMutation.isPending}
                          data-testid="button-approve-quote"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {respondMutation.isPending && isApproving ? "Approving..." : "Approve Quote"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRespond(false)}
                          disabled={respondMutation.isPending}
                          data-testid="button-reject-quote"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {respondMutation.isPending && !isApproving ? "Declining..." : "Decline"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
