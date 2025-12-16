import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Download, FileSignature, Eye, Check, X, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const documentTypeIcons: Record<string, any> = {
  contract: FileSignature,
  invoice: FileText,
  deliverable: FileText,
  mockup: FileText,
  asset: FileText,
  other: FileText,
};

interface SignatureField {
  id: string;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ClientDocuments() {
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
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
      setReviewDialogOpen(false);
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

  const documents = Array.isArray(documentsData) ? documentsData : [];
  const unsignedDocs = documents.filter((d: any) => d.requiresSignature && !d.isSigned);
  const signedDocs = documents.filter((d: any) => d.requiresSignature && d.isSigned);
  const otherDocs = documents.filter((d: any) => !d.requiresSignature);

  const handleReviewAndSign = (doc: any) => {
    setSelectedDocument(doc);
    setCurrentPage(1);
    setScale(1.0);
    setTypedSignature("");
    if (doc.fileUrl && doc.fileUrl.endsWith('.pdf')) {
      setReviewDialogOpen(true);
    } else {
      setSignDialogOpen(true);
    }
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setCurrentPage(1);
    setScale(1.0);
    setReviewDialogOpen(true);
  };

  const submitSignature = () => {
    if (!typedSignature.trim() || !selectedDocument) return;
    signMutation.mutate({
      documentId: selectedDocument.id,
      signature: typedSignature,
    });
  };

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page;
    setPdfDimensions({ width, height });
  }, []);

  const getSignatureFields = (): SignatureField[] => {
    if (!selectedDocument?.signatureFields) return [];
    try {
      const fields = typeof selectedDocument.signatureFields === 'string' 
        ? JSON.parse(selectedDocument.signatureFields)
        : selectedDocument.signatureFields;
      return Array.isArray(fields) ? fields : [];
    } catch {
      return [];
    }
  };

  const signatureFields = getSignatureFields();
  const currentPageFields = signatureFields.filter(f => f.page === currentPage);

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
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                              {doc.fileUrl && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleViewDocument(doc)}
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
                                  onClick={() => handleReviewAndSign(doc)}
                                  data-testid={`button-sign-${doc.id}`}
                                >
                                  <FileSignature className="w-4 h-4 mr-1" />
                                  Review & Sign
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
                            onClick={() => handleReviewAndSign(doc)}
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

      {/* Document Review & Sign Dialog - Full Screen with PDF Viewer */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 p-4 border-b shrink-0">
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-serif text-lg truncate">
                {selectedDocument?.title}
              </DialogTitle>
              <DialogDescription className="text-sm truncate">
                {selectedDocument?.requiresSignature && !selectedDocument?.isSigned
                  ? "Review the document below and sign when ready"
                  : "Viewing document"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedDocument?.fileUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={selectedDocument.fileUrl} download={selectedDocument.fileName || selectedDocument.title}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </a>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setReviewDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* PDF Viewer */}
            <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
              {/* PDF Toolbar */}
              <div className="flex items-center justify-between gap-4 p-2 border-b bg-background shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                    disabled={scale <= 0.5}
                    data-testid="button-zoom-out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-16 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setScale(Math.min(3, scale + 0.25))}
                    disabled={scale >= 3}
                    data-testid="button-zoom-in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Page {currentPage} of {numPages || "..."}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* PDF Content */}
              <div className="flex-1 overflow-auto p-4 flex justify-center">
                {selectedDocument?.fileUrl ? (
                  <div className="relative inline-block">
                    <Document
                      file={selectedDocument.fileUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center p-12">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      }
                      error={
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                          <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">Unable to load PDF</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-4"
                            onClick={() => window.open(selectedDocument.fileUrl, "_blank")}
                          >
                            Open in new tab
                          </Button>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={currentPage}
                        scale={scale}
                        onLoadSuccess={onPageLoadSuccess}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>

                    {/* Signature Field Overlays */}
                    {pdfDimensions && currentPageFields.map((field) => {
                      const scaledX = field.x * scale;
                      const scaledY = (pdfDimensions.height - field.y - field.height) * scale;
                      const scaledWidth = field.width * scale;
                      const scaledHeight = field.height * scale;

                      return (
                        <div
                          key={field.id}
                          className="absolute border-2 border-dashed border-primary/60 bg-primary/10 rounded flex items-center justify-center pointer-events-none"
                          style={{
                            left: scaledX,
                            top: scaledY,
                            width: scaledWidth,
                            height: scaledHeight,
                          }}
                        >
                          {typedSignature ? (
                            <span 
                              className="font-serif italic text-foreground"
                              style={{ fontSize: Math.min(scaledHeight * 0.6, 24) }}
                            >
                              {typedSignature}
                            </span>
                          ) : (
                            <span className="text-xs text-primary/70">Sign here</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No document file attached</p>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Panel - Only show if document requires signature and is not signed */}
            {selectedDocument?.requiresSignature && !selectedDocument?.isSigned && (
              <div className="w-80 border-l bg-background flex flex-col shrink-0">
                <div className="p-4 border-b">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileSignature className="w-4 h-4" />
                    Sign Document
                  </h3>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-signature">Type your full legal name</Label>
                    <Input
                      id="client-signature"
                      placeholder="Your full name"
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
                  {signatureFields.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Signature locations:</p>
                      {signatureFields.map((field, idx) => (
                        <p key={field.id} className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">{idx + 1}</span>
                          Page {field.page}: {field.label}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    By signing, you agree to the terms outlined in this document. Your signature will be applied to all marked signature locations.
                  </p>
                </div>
                <div className="p-4 border-t flex flex-col gap-2">
                  <Button
                    onClick={submitSignature}
                    disabled={!typedSignature.trim() || signMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-signature"
                  >
                    {signMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Sign Document
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Simple Signature Dialog (fallback for non-PDF documents) */}
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
                data-testid="input-signature-fallback"
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
              data-testid="button-submit-signature-fallback"
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
