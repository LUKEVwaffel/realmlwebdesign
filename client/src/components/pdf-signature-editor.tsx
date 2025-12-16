import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Trash2, 
  FileSignature, 
  Move, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  FileText,
  PenTool
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface SignatureField {
  id: string;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PDFSignatureEditorProps {
  pdfUrl: string | null;
  signatureFields: SignatureField[];
  onFieldsChange: (fields: SignatureField[]) => void;
}

export function PDFSignatureEditor({ pdfUrl, signatureFields, onFieldsChange }: PDFSignatureEditorProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 612, height: 792 });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.0);
  const [localFields, setLocalFields] = useState<SignatureField[]>(signatureFields);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFields(signatureFields);
  }, [signatureFields]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    if (error.message.includes("Missing PDF")) {
      setPdfError("Could not load PDF. The URL may be invalid or the server doesn't allow direct access (CORS). Try using a direct download link.");
    } else {
      setPdfError("Failed to load PDF. Please check the URL and try again.");
    }
  };

  const onPageLoadSuccess = (page: any) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPdfDimensions({ width, height });
  };

  const addSignatureField = () => {
    const newField: SignatureField = {
      id: `sig-${Date.now()}`,
      label: `Signature ${localFields.length + 1}`,
      page: currentPage,
      x: 100,
      y: pdfDimensions.height / 2,
      width: 200,
      height: 50,
    };
    setLocalFields([...localFields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setLocalFields(localFields.filter(f => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const updateField = (id: string, updates: Partial<SignatureField>) => {
    setLocalFields(localFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const pdfToCssTop = (pdfY: number, fieldHeight: number) => {
    return pdfDimensions.height - pdfY - fieldHeight;
  };

  const cssToPdfY = (cssTop: number, fieldHeight: number) => {
    return pdfDimensions.height - cssTop - fieldHeight;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const field = localFields.find(f => f.id === fieldId);
    if (!field || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    const mouseX = (e.clientX - rect.left + scrollLeft) / scale;
    const mouseY = (e.clientY - rect.top + scrollTop) / scale;
    
    const cssTop = pdfToCssTop(field.y, field.height);
    
    setSelectedFieldId(fieldId);
    setIsDragging(true);
    setDragOffset({
      x: mouseX - field.x,
      y: mouseY - cssTop,
    });
  }, [localFields, scale, pdfDimensions.height]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedFieldId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    const mouseX = (e.clientX - rect.left + scrollLeft) / scale;
    const mouseY = (e.clientY - rect.top + scrollTop) / scale;
    
    const field = localFields.find(f => f.id === selectedFieldId);
    if (!field) return;

    let newCssLeft = mouseX - dragOffset.x;
    let newCssTop = mouseY - dragOffset.y;

    newCssLeft = Math.max(0, Math.min(newCssLeft, pdfDimensions.width - field.width));
    newCssTop = Math.max(0, Math.min(newCssTop, pdfDimensions.height - field.height));

    const newPdfX = Math.round(newCssLeft);
    const newPdfY = Math.round(cssToPdfY(newCssTop, field.height));

    updateField(selectedFieldId, { x: newPdfX, y: newPdfY });
  }, [isDragging, selectedFieldId, dragOffset, scale, pdfDimensions, localFields]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = () => {
    onFieldsChange(localFields);
    setIsEditorOpen(false);
  };

  const handleCancel = () => {
    setLocalFields(signatureFields);
    setIsEditorOpen(false);
  };

  const currentPageFields = localFields.filter(f => f.page === currentPage);

  if (!pdfUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            Signature Fields
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addSignatureField}
            data-testid="button-add-signature-field"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Field
          </Button>
        </div>
        
        <div className="p-6 border rounded-lg bg-muted/30 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Add a PDF URL above to visually place signature fields.
          </p>
          <p className="text-xs text-muted-foreground">
            Without a PDF, you can still add signature fields with manual coordinates.
          </p>
        </div>

        {signatureFields.length > 0 && (
          <div className="space-y-2">
            {signatureFields.map((field, index) => (
              <div key={field.id} className="p-3 bg-background rounded-md border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      const updatedFields = signatureFields.map(f => 
                        f.id === field.id ? { ...f, label: e.target.value } : f
                      );
                      onFieldsChange(updatedFields);
                    }}
                    placeholder="Signature label"
                    className="flex-1"
                    data-testid={`input-signature-label-${index}`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => onFieldsChange(signatureFields.filter(f => f.id !== field.id))}
                    data-testid={`button-remove-signature-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Page</Label>
                    <Input
                      type="number"
                      min={1}
                      value={field.page}
                      onChange={(e) => {
                        const updatedFields = signatureFields.map(f => 
                          f.id === field.id ? { ...f, page: parseInt(e.target.value) || 1 } : f
                        );
                        onFieldsChange(updatedFields);
                      }}
                      data-testid={`input-signature-page-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={field.x}
                      onChange={(e) => {
                        const updatedFields = signatureFields.map(f => 
                          f.id === field.id ? { ...f, x: parseInt(e.target.value) || 0 } : f
                        );
                        onFieldsChange(updatedFields);
                      }}
                      data-testid={`input-signature-x-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={field.y}
                      onChange={(e) => {
                        const updatedFields = signatureFields.map(f => 
                          f.id === field.id ? { ...f, y: parseInt(e.target.value) || 0 } : f
                        );
                        onFieldsChange(updatedFields);
                      }}
                      data-testid={`input-signature-y-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      min={50}
                      value={field.width}
                      onChange={(e) => {
                        const updatedFields = signatureFields.map(f => 
                          f.id === field.id ? { ...f, width: parseInt(e.target.value) || 200 } : f
                        );
                        onFieldsChange(updatedFields);
                      }}
                      data-testid={`input-signature-width-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      min={30}
                      value={field.height}
                      onChange={(e) => {
                        const updatedFields = signatureFields.map(f => 
                          f.id === field.id ? { ...f, height: parseInt(e.target.value) || 50 } : f
                        );
                        onFieldsChange(updatedFields);
                      }}
                      data-testid={`input-signature-height-${index}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Position values are in PDF points (1 inch = 72 points). Standard letter size is 612x792 points.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <FileSignature className="w-4 h-4" />
          Signature Fields ({signatureFields.length})
        </Label>
        <Button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          data-testid="button-open-pdf-editor"
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Open PDF Editor
        </Button>
      </div>

      {signatureFields.length > 0 && (
        <div className="space-y-2">
          {signatureFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
              <Badge variant="outline" className="shrink-0">Page {field.page}</Badge>
              <span className="flex-1 text-sm truncate">{field.label}</span>
              <span className="text-xs text-muted-foreground shrink-0">({field.x}, {field.y})</span>
            </div>
          ))}
        </div>
      )}

      {signatureFields.length === 0 && (
        <div className="p-4 border rounded-lg bg-muted/30 text-center">
          <PenTool className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No signature fields added yet. Click "Open PDF Editor" to place signature boxes on the document.
          </p>
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <DialogTitle className="text-lg font-semibold">
                PDF Signature Editor
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-16 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setScale(s => Math.min(2, s + 0.1))}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            <div className="w-72 border-r bg-muted/30 flex flex-col shrink-0">
              <div className="p-4 border-b">
                <Button
                  type="button"
                  className="w-full"
                  onClick={addSignatureField}
                  data-testid="button-add-signature-field-editor"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Signature Field
                </Button>
              </div>
              
              <div className="p-3 border-b">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Signature Fields ({localFields.length})
                </Label>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {localFields.length === 0 ? (
                    <div className="p-4 text-center">
                      <PenTool className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">
                        Click "Add Signature Field" to place signature boxes on the PDF.
                      </p>
                    </div>
                  ) : (
                    localFields.map((field, index) => (
                      <div 
                        key={field.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedFieldId === field.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'bg-background hover-elevate'
                        }`}
                        onClick={() => {
                          setSelectedFieldId(field.id);
                          setCurrentPage(field.page);
                        }}
                        data-testid={`signature-field-item-${index}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            Page {field.page}
                          </Badge>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(field.id);
                            }}
                            data-testid={`button-remove-signature-${index}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="h-8 text-sm mb-2"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`input-signature-label-${index}`}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">X Position</Label>
                            <Input
                              type="number"
                              value={field.x}
                              onChange={(e) => updateField(field.id, { x: parseInt(e.target.value) || 0 })}
                              className="h-7 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Y Position</Label>
                            <Input
                              type="number"
                              value={field.y}
                              onChange={(e) => updateField(field.id, { y: parseInt(e.target.value) || 0 })}
                              className="h-7 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-muted/50">
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 p-2 border-b bg-background shrink-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {numPages}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div 
                ref={containerRef}
                className="flex-1 overflow-auto flex justify-center p-6 select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div 
                  className="relative shadow-lg bg-white"
                  style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top center',
                    minWidth: pdfDimensions.width,
                    minHeight: pdfDimensions.height,
                  }}
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div 
                        className="flex items-center justify-center bg-white"
                        style={{ width: pdfDimensions.width, height: pdfDimensions.height }}
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Loading PDF...</p>
                        </div>
                      </div>
                    }
                    error={
                      <div 
                        className="flex items-center justify-center bg-white p-8"
                        style={{ width: pdfDimensions.width, height: pdfDimensions.height }}
                      >
                        <div className="text-center max-w-sm">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                          <p className="text-sm font-medium text-destructive mb-2">Failed to load PDF</p>
                          <p className="text-xs text-muted-foreground mb-4">{pdfError}</p>
                          <div className="text-left text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
                            <p className="font-medium mb-2">Troubleshooting tips:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Make sure the URL ends with .pdf</li>
                              <li>Use a direct download link (not a preview page)</li>
                              <li>Try uploading to a file hosting service</li>
                              <li>Check that the file is publicly accessible</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <Page 
                      pageNumber={currentPage} 
                      onLoadSuccess={onPageLoadSuccess}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>

                  {currentPageFields.map((field) => (
                    <div
                      key={field.id}
                      className={`absolute border-2 border-dashed rounded flex items-center justify-center cursor-move transition-all ${
                        selectedFieldId === field.id 
                          ? 'border-primary bg-primary/20 shadow-lg ring-2 ring-primary ring-offset-2' 
                          : 'border-blue-500 bg-blue-100/60 hover:bg-blue-100/80'
                      }`}
                      style={{
                        left: field.x,
                        top: pdfDimensions.height - field.y - field.height,
                        width: field.width,
                        height: field.height,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                      data-testid={`signature-box-${field.id}`}
                    >
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-700 px-2">
                        <Move className="w-3 h-3" />
                        <span className="truncate">{field.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t bg-background shrink-0">
            <p className="text-xs text-muted-foreground">
              Drag signature boxes to position them. Click a field in the sidebar to select it.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel-pdf-editor"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                data-testid="button-save-pdf-editor"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
