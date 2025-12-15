import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Download, FileSignature, Eye, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

const documentTypeIcons: Record<string, any> = {
  contract: FileSignature,
  invoice: FileText,
  deliverable: FileText,
  mockup: FileText,
  asset: FileText,
  other: FileText,
};

export default function ClientDocuments() {
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [typedSignature, setTypedSignature] = useState("");
  const { toast } = useToast();

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ["/api/client/documents"],
  });

  const signMutation = useMutation({
    mutationFn: async ({ documentId, signature }: { documentId: string; signature: string }) => {
      return apiRequest("POST", `/api/documents/${documentId}/sign`, {
        signatureData: signature,
        signatureType: "typed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/dashboard"] });
      setSignDialogOpen(false);
      setTypedSignature("");
      toast({
        title: "Document Signed",
        description: "Your signature has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const documents = documentsData?.documents || [];
  const unsignedDocs = documents.filter((d: any) => d.requiresSignature && !d.isSigned);
  const signedDocs = documents.filter((d: any) => d.requiresSignature && d.isSigned);
  const otherDocs = documents.filter((d: any) => !d.requiresSignature);

  const handleSign = (doc: any) => {
    setSelectedDocument(doc);
    setSignDialogOpen(true);
  };

  const submitSignature = () => {
    if (!typedSignature.trim() || !selectedDocument) return;
    signMutation.mutate({
      documentId: selectedDocument.id,
      signature: typedSignature,
    });
  };

  return (
    <PortalLayout requiredRole="client">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-documents-title">
            Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            View and sign your project documents
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All Documents</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending Signature
              {unsignedDocs.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unsignedDocs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : documents.length > 0 ? (
              <div className="grid gap-4">
                {documents.map((doc: any) => {
                  const Icon = documentTypeIcons[doc.documentType] || FileText;
                  return (
                    <Card key={doc.id} className="border-border/50" data-testid={`card-document-${doc.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-medium">{doc.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.description || doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Added {format(new Date(doc.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.requiresSignature && (
                                  <Badge variant={doc.isSigned ? "secondary" : "destructive"}>
                                    {doc.isSigned ? (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Signed
                                      </>
                                    ) : (
                                      <>
                                        <FileSignature className="w-3 h-3 mr-1" />
                                        Needs Signature
                                      </>
                                    )}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              {doc.fileUrl && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => window.open(doc.fileUrl, "_blank")}
                                    data-testid={`button-view-${doc.id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    asChild
                                    data-testid={`button-download-${doc.id}`}
                                  >
                                    <a href={doc.fileUrl} download={doc.fileName || doc.title}>
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </a>
                                  </Button>
                                </>
                              )}
                              {!doc.fileUrl && (
                                <span className="text-xs text-muted-foreground">No file attached</span>
                              )}
                              {doc.requiresSignature && !doc.isSigned && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSign(doc)}
                                  data-testid={`button-sign-${doc.id}`}
                                >
                                  <FileSignature className="w-4 h-4 mr-1" />
                                  Sign Document
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents available yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {unsignedDocs.length > 0 ? (
              <div className="grid gap-4">
                {unsignedDocs.map((doc: any) => (
                  <Card
                    key={doc.id}
                    className="border-destructive/30 bg-destructive/5"
                    data-testid={`card-pending-doc-${doc.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                          <FileSignature className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {doc.description}
                          </p>
                          <Button
                            size="sm"
                            className="mt-4"
                            onClick={() => handleSign(doc)}
                            data-testid={`button-sign-pending-${doc.id}`}
                          >
                            <FileSignature className="w-4 h-4 mr-1" />
                            Review & Sign
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">All documents have been signed</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Signature Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Sign Document</DialogTitle>
            <DialogDescription>
              Type your full legal name below to sign "{selectedDocument?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signature">Your Signature</Label>
              <Input
                id="signature"
                placeholder="Type your full name"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                className="font-serif text-lg"
                data-testid="input-signature"
              />
            </div>
            {typedSignature && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Signature Preview:</p>
                <p className="font-serif text-2xl italic">{typedSignature}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              By signing, you agree to the terms outlined in this document.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitSignature}
              disabled={!typedSignature.trim() || signMutation.isPending}
              data-testid="button-submit-signature"
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                "Sign Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
