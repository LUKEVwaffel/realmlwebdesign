import { useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileSignature, Move, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

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
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 612, height: 792 });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = 0.8;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setPdfError(null);
  };

  const onDocumentLoadError = () => {
    setPdfError("Failed to load PDF. Please check the URL.");
  };

  const onPageLoadSuccess = (page: any) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPdfDimensions({ width, height });
  };

  const addSignatureField = () => {
    const newField: SignatureField = {
      id: `sig-${Date.now()}`,
      label: `Signature ${signatureFields.length + 1}`,
      page: currentPage,
      x: 50,
      y: 100,
      width: 200,
      height: 50,
    };
    onFieldsChange([...signatureFields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    onFieldsChange(signatureFields.filter(f => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const updateField = (id: string, updates: Partial<SignatureField>) => {
    onFieldsChange(signatureFields.map(f => f.id === id ? { ...f, ...updates } : f));
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
    const field = signatureFields.find(f => f.id === fieldId);
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
  }, [signatureFields, scale, pdfDimensions.height]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedFieldId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    const mouseX = (e.clientX - rect.left + scrollLeft) / scale;
    const mouseY = (e.clientY - rect.top + scrollTop) / scale;
    
    const field = signatureFields.find(f => f.id === selectedFieldId);
    if (!field) return;

    let newCssLeft = mouseX - dragOffset.x;
    let newCssTop = mouseY - dragOffset.y;

    newCssLeft = Math.max(0, Math.min(newCssLeft, pdfDimensions.width - field.width));
    newCssTop = Math.max(0, Math.min(newCssTop, pdfDimensions.height - field.height));

    const newPdfX = Math.round(newCssLeft);
    const newPdfY = Math.round(cssToPdfY(newCssTop, field.height));

    updateField(selectedFieldId, { x: newPdfX, y: newPdfY });
  }, [isDragging, selectedFieldId, dragOffset, scale, pdfDimensions, signatureFields, updateField]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const currentPageFields = signatureFields.filter(f => f.page === currentPage);

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
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Signature label"
                    className="flex-1"
                    data-testid={`input-signature-label-${index}`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeField(field.id)}
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
                      onChange={(e) => updateField(field.id, { page: parseInt(e.target.value) || 1 })}
                      data-testid={`input-signature-page-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={field.x}
                      onChange={(e) => updateField(field.id, { x: parseInt(e.target.value) || 0 })}
                      data-testid={`input-signature-x-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={field.y}
                      onChange={(e) => updateField(field.id, { y: parseInt(e.target.value) || 0 })}
                      data-testid={`input-signature-y-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      min={50}
                      value={field.width}
                      onChange={(e) => updateField(field.id, { width: parseInt(e.target.value) || 200 })}
                      data-testid={`input-signature-width-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      min={30}
                      value={field.height}
                      onChange={(e) => updateField(field.id, { height: parseInt(e.target.value) || 50 })}
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

      <div className="border rounded-lg overflow-hidden bg-muted/30">
        {numPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-2 border-b bg-background">
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
            <span className="text-sm">
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
          className="relative flex justify-center p-4 overflow-auto max-h-[500px] select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="w-[612px] h-[792px] flex items-center justify-center bg-background border">Loading PDF...</div>}
              error={<div className="w-[612px] h-[792px] flex items-center justify-center bg-background border text-destructive">{pdfError}</div>}
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
                className={`absolute border-2 rounded cursor-move flex items-center justify-center text-xs font-medium transition-colors ${
                  selectedFieldId === field.id 
                    ? 'border-primary bg-primary/20 text-primary' 
                    : 'border-blue-500 bg-blue-100/50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
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
                <Move className="w-3 h-3 mr-1" />
                {field.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {signatureFields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Signature Fields ({signatureFields.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {signatureFields.map((field, index) => (
              <div 
                key={field.id} 
                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                  selectedFieldId === field.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => {
                  setSelectedFieldId(field.id);
                  setCurrentPage(field.page);
                }}
                data-testid={`signature-field-item-${index}`}
              >
                <Badge variant="outline" className="shrink-0">
                  Page {field.page}
                </Badge>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  className="flex-1 h-8"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`input-signature-label-${index}`}
                />
                <span className="text-xs text-muted-foreground shrink-0">
                  ({field.x}, {field.y})
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(field.id);
                  }}
                  data-testid={`button-remove-signature-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Click and drag signature boxes to position them on the PDF. Fields will appear where clients need to sign.
      </p>
    </div>
  );
}
