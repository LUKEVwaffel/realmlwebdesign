import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Check, AlertCircle } from "lucide-react";

interface FileUploaderProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => Promise<{ url: string; objectPath: string }>;
  onComplete?: (result: { url: string; objectPath: string; file: File }) => void;
  buttonLabel?: string;
  disabled?: boolean;
}

export function FileUploader({
  accept = ".pdf,.doc,.docx",
  maxSize = 52428800,
  onUpload,
  onComplete,
  buttonLabel = "Upload File",
  disabled = false,
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(10);

    try {
      setProgress(30);
      const result = await onUpload(file);
      setProgress(100);
      
      setUploadedFile({ name: file.name, url: result.url });
      onComplete?.({ ...result, file });
      
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setProgress(0);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
        data-testid="input-file-upload"
      />

      {!uploadedFile && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full"
          data-testid="button-select-file"
        >
          <Upload className="w-4 h-4 mr-2" />
          {buttonLabel}
        </Button>
      )}

      {isUploading && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Uploading...</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {uploadedFile && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />
              <span>Uploaded successfully</span>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={clearUpload}
            data-testid="button-clear-upload"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Supported formats: PDF, DOC, DOCX. Max size: {Math.round(maxSize / 1024 / 1024)}MB
      </p>
    </div>
  );
}
