import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Upload, 
  FileImage, 
  FileText, 
  File, 
  Trash2, 
  Download,
  Loader2,
  FolderOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileUploader } from "@/components/FileUploader";
import { format } from "date-fns";

const fileTypeCategories = [
  { value: "logo", label: "Logo / Branding" },
  { value: "content", label: "Text Content" },
  { value: "image", label: "Images / Photos" },
  { value: "document", label: "Documents" },
  { value: "other", label: "Other Assets" },
];

const getFileIcon = (category: string) => {
  switch (category) {
    case "logo":
    case "image":
      return FileImage;
    case "content":
    case "document":
      return FileText;
    default:
      return File;
  }
};

export default function ClientUploads() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFileData, setUploadedFileData] = useState<{ url: string; objectPath: string; file: File } | null>(null);
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const { data: uploadsData, isLoading } = useQuery<{ uploads: any[] }>({
    queryKey: ["/api/client/uploads"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { fileName: string; fileUrl: string; fileSize: number; fileType: string; category: string; description: string }) => {
      return apiRequest("POST", "/api/client/uploads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/uploads"] });
      setUploadDialogOpen(false);
      setUploadedFileData(null);
      setFileName("");
      setCategory("");
      setDescription("");
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      return apiRequest("DELETE", `/api/client/uploads/${uploadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/uploads"] });
      toast({
        title: "File Deleted",
        description: "Your file has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Could not delete the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploads = uploadsData?.uploads || [];

  const handleFileUpload = async (file: File): Promise<{ url: string; objectPath: string }> => {
    const token = localStorage.getItem("auth_token");
    
    const urlRes = await fetch("/api/client/documents/upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filename: file.name }),
    });

    if (!urlRes.ok) {
      const error = await urlRes.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { uploadURL, objectPath } = await urlRes.json();

    const uploadRes = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload file");
    }

    return { url: objectPath, objectPath };
  };

  const handleSubmit = async () => {
    if (!uploadedFileData || !category) return;
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({
        fileName: fileName || uploadedFileData.file.name,
        fileUrl: uploadedFileData.url,
        fileSize: uploadedFileData.file.size,
        fileType: uploadedFileData.file.type,
        category,
        description,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (uploadId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(uploadId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const resetDialog = () => {
    setUploadDialogOpen(false);
    setUploadedFileData(null);
    setFileName("");
    setCategory("");
    setDescription("");
  };

  return (
    <PortalLayout requiredRole="client">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-uploads-title">
              Uploads
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload logos, content, and assets for your project
            </p>
          </div>
          <Button 
            onClick={() => setUploadDialogOpen(true)} 
            className="gap-2"
            data-testid="button-upload-file"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Your Files</CardTitle>
            <CardDescription>
              Files you've uploaded for your web design project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : uploads.length > 0 ? (
              <div className="space-y-4">
                {uploads.map((upload: any) => {
                  const Icon = getFileIcon(upload.category);
                  return (
                    <div
                      key={upload.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-muted/30"
                      data-testid={`upload-item-${upload.id}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{upload.fileName}</h3>
                            {upload.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {upload.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="secondary">
                                {fileTypeCategories.find(c => c.value === upload.category)?.label || upload.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(upload.fileSize)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Uploaded {format(new Date(upload.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {upload.fileUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                                data-testid={`button-download-${upload.id}`}
                              >
                                <a href={upload.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(upload.id)}
                              className="text-destructive"
                              data-testid={`button-delete-${upload.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No files uploaded yet</p>
                <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Your First File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Upload File</DialogTitle>
            <DialogDescription>
              Drag and drop a file or click to browse. Upload logos, images, documents, or any other assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FileUploader
              onUpload={handleFileUpload}
              onComplete={(result) => {
                setUploadedFileData(result);
                if (!fileName) {
                  setFileName(result.file.name);
                }
              }}
              buttonLabel="Choose File"
            />

            {uploadedFileData && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g., Company Logo"
                    data-testid="input-file-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypeCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this file..."
                    rows={3}
                    data-testid="input-description"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!uploadedFileData || !category || isUploading}
              data-testid="button-submit-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
