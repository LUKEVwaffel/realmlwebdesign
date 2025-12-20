import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  FileText,
  MessageSquare,
  DollarSign,
  User,
  Plus,
  Key,
  Upload,
  Copy,
  Check,
  Settings,
  ClipboardList,
  Save,
  ExternalLink,
  Trash2,
  FileSignature,
  Eye,
  Send,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PortalLayout } from "@/components/portal/portal-layout";
import { PDFSignatureEditor, SignatureField } from "@/components/pdf-signature-editor";
import { FileUploader } from "@/components/FileUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  created: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  questionnaire_pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  questionnaire_complete: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  tos_pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  tos_signed: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  design_pending: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  design_approved: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  in_development: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  hosting_setup: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  deployed: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  delivery: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  client_review: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_hold: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const phaseLabels: Record<string, { label: string; phase: number; description: string }> = {
  created: { label: "Client Setup", phase: 1, description: "Client account created and ready for onboarding" },
  questionnaire_pending: { label: "Questionnaire", phase: 2, description: "Waiting for client to complete questionnaire" },
  questionnaire_complete: { label: "Questionnaire Complete", phase: 2, description: "Client has completed the questionnaire" },
  tos_pending: { label: "Terms of Service", phase: 3, description: "Waiting for client to sign Terms of Service" },
  tos_signed: { label: "TOS Signed", phase: 3, description: "Client has signed Terms of Service" },
  design_pending: { label: "Development", phase: 4, description: "Website development in progress" },
  design_approved: { label: "Development", phase: 4, description: "Website development in progress" },
  in_development: { label: "Development", phase: 4, description: "Website is being built" },
  hosting_setup: { label: "Hosting Setup", phase: 5, description: "Setting up hosting and domain configuration" },
  deployed: { label: "Deployed", phase: 5, description: "Website has been deployed to hosting" },
  delivery: { label: "Final Delivery", phase: 6, description: "Final review and handoff to client" },
  client_review: { label: "Client Review", phase: 6, description: "Client is reviewing the final delivery" },
  completed: { label: "Project Complete", phase: 7, description: "Project has been successfully completed" },
  on_hold: { label: "On Hold", phase: 0, description: "Project is temporarily paused" },
  cancelled: { label: "Cancelled", phase: 0, description: "Project has been cancelled" },
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function ClientDetails() {
  const { toast } = useToast();
  const [, params] = useRoute("/admin/clients/:id");
  const clientId = params?.id;
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);

  const [newProject, setNewProject] = useState({
    projectType: "new_website",
    projectTypeOther: "",
    totalCost: "",
    paymentStructure: "50_50",
    specialRequirements: "",
  });

  const [newPayment, setNewPayment] = useState({
    description: "",
    amount: "",
    dueDate: "",
  });

  const [newDocument, setNewDocument] = useState({
    title: "",
    documentType: "contract",
    description: "",
    fileUrl: "",
    requiresSignature: false,
    requiresAcknowledgment: false,
    visibleToClient: true,
    signatureFields: [] as SignatureField[],
  });
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isGeneratingTos, setIsGeneratingTos] = useState(false);
  const [tosPdfDataUrl, setTosPdfDataUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [projectSettings, setProjectSettings] = useState({
    projectType: "new_website",
    status: "questionnaire_pending",
    totalCost: "0.00",
    paymentStructure: "50_50",
    domain: "",
    hosting: "",
    specialRequirements: "",
  });

  const { data: client, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/clients", clientId],
    enabled: !!clientId,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/projects", { ...data, clientId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      setIsProjectDialogOpen(false);
      setNewProject({ projectType: "new_website", projectTypeOther: "", totalCost: "", paymentStructure: "50_50", specialRequirements: "" });
      toast({ title: "Project created", description: "New project has been added for this client." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create project", description: error.message, variant: "destructive" });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/payments", { ...data, clientId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      setIsPaymentDialogOpen(false);
      setNewPayment({ description: "", amount: "", dueDate: "" });
      toast({ title: "Payment created", description: "New payment has been added for this client." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create payment", description: error.message, variant: "destructive" });
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/documents", { ...data, clientId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      setIsDocumentDialogOpen(false);
      setNewDocument({ title: "", documentType: "contract", description: "", fileUrl: "", requiresSignature: false, requiresAcknowledgment: false, visibleToClient: true, signatureFields: [] });
      setUploadedFileName(null);
      setTosPdfDataUrl(null);
      toast({ title: "Document created", description: "New document has been added for this client." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create document", description: error.message, variant: "destructive" });
    },
  });

  const sendTosMutation = useMutation({
    mutationFn: async (signatureFields: SignatureField[]) => {
      const serializedFields = signatureFields.map(({ id, page, x, y, width, height, label }) => ({
        id, page, x, y, width, height, label
      }));
      const res = await apiRequest("POST", `/api/admin/clients/${clientId}/tos/send`, { signatureFields: serializedFields });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      setIsDocumentDialogOpen(false);
      setNewDocument({ title: "", documentType: "contract", description: "", fileUrl: "", requiresSignature: false, requiresAcknowledgment: false, visibleToClient: true, signatureFields: [] });
      setTosPdfDataUrl(null);
      toast({ title: "Terms of Service sent", description: "TOS has been sent to the client for signing." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send TOS", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/clients/${clientId}/reset-password`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Password reset", description: `New temporary password: ${data.tempPassword}` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to reset password", description: error.message, variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Settings saved", description: "Project settings have been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save settings", description: error.message, variant: "destructive" });
    },
  });

  const saveSignatureMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await apiRequest("POST", `/api/admin/documents/${documentId}/save-signature`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Signature saved", description: "The signature has been saved to the client's profile permanently." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save signature", description: error.message, variant: "destructive" });
    },
  });

  // Sync project settings when client data loads
  useEffect(() => {
    if (client?.projects?.[0]) {
      const project = client.projects[0];
      setProjectSettings({
        projectType: project.projectType || "new_website",
        status: project.status || "pending_payment",
        totalCost: project.totalCost || "0.00",
        paymentStructure: project.paymentStructure || "50_50",
        domain: project.domain || "",
        hosting: project.hosting || "",
        specialRequirements: project.specialRequirements || "",
      });
    }
  }, [client]);

  const handleSaveProjectSettings = () => {
    const project = client?.projects?.[0];
    if (!project) {
      toast({ title: "No project found", description: "This client doesn't have a project yet.", variant: "destructive" });
      return;
    }
    updateProjectMutation.mutate({ projectId: project.id, data: projectSettings });
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate(newProject);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    createPaymentMutation.mutate(newPayment);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDocument.documentType === "terms_of_service") {
      sendTosMutation.mutate(newDocument.signatureFields);
    } else {
      createDocumentMutation.mutate(newDocument);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  if (isLoading) {
    return (
      <PortalLayout requiredRole="admin">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (!client) {
    return (
      <PortalLayout requiredRole="admin">
        <div className="p-6">
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Client not found</p>
            <Button asChild className="mt-4">
              <Link href="/admin/clients">Back to Clients</Link>
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href="/admin/clients">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-client-name">
                {client.businessLegalName}
              </h1>
              <p className="text-muted-foreground">{client.industry || "No industry specified"}</p>
            </div>
          </div>
          <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-manage-credentials">
                <Key className="w-4 h-4" />
                Login Credentials
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Client Login Credentials</DialogTitle>
                <DialogDescription>Manage login access for this client</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Login Email</Label>
                  <div className="flex gap-2">
                    <Input value={client.user?.email || ""} readOnly className="bg-muted" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(client.user?.email || "")}>
                      {copiedPassword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Reset the client's password to generate a new temporary password. They will be required to change it on first login.
                  </p>
                  <Button 
                    onClick={() => resetPasswordMutation.mutate()} 
                    disabled={resetPasswordMutation.isPending}
                    variant="destructive"
                    data-testid="button-reset-password"
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.user && (
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium">{client.user.firstName} {client.user.lastName}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.businessEmail || client.user?.email}</span>
              </div>
              {client.businessPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{client.businessPhone}</span>
                </div>
              )}
              {client.existingWebsite && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href={client.existingWebsite} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                    {client.existingWebsite}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Client since {client.createdAt ? format(new Date(client.createdAt), "MMM d, yyyy") : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.projects?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.payments?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Payments</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.documents?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.messages?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="flex-wrap gap-1">
            <TabsTrigger value="settings" data-testid="tab-project-settings">Project Settings</TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
            <TabsTrigger value="uploads" data-testid="tab-uploads">Client Uploads</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              {client.projects?.length > 0 ? (
                <>
                  <Card data-testid="card-workflow-phases">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Project Workflow
                      </CardTitle>
                      <CardDescription>
                        {phaseLabels[projectSettings.status]?.description || "Current project phase"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((phase) => {
                          const currentPhase = phaseLabels[projectSettings.status]?.phase || 0;
                          const isComplete = currentPhase > phase;
                          const isCurrent = currentPhase === phase;
                          const phaseNames = ["Setup", "Questionnaire", "Terms", "Development", "Hosting", "Delivery", "Complete"];
                          
                          return (
                            <div 
                              key={phase}
                              className={`flex-1 min-w-[100px] text-center p-3 rounded-lg border transition-all ${
                                isCurrent 
                                  ? "bg-primary/10 border-primary text-primary font-medium" 
                                  : isComplete 
                                    ? "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400" 
                                    : "bg-muted/50 border-transparent text-muted-foreground"
                              }`}
                              data-testid={`phase-indicator-${phase}`}
                            >
                              <div className={`text-xs mb-1 ${isCurrent ? "text-primary" : ""}`}>Phase {phase}</div>
                              <div className="text-sm font-medium">{phaseNames[phase - 1]}</div>
                              {isComplete && <Check className="w-4 h-4 mx-auto mt-1 text-green-600 dark:text-green-400" />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                        <Badge className={statusColors[projectSettings.status] || ""}>
                          {phaseLabels[projectSettings.status]?.label || projectSettings.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {phaseLabels[projectSettings.status]?.description}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Project Overview
                        </CardTitle>
                        <CardDescription>Core project configuration and status</CardDescription>
                      </div>
                      <Button 
                        onClick={handleSaveProjectSettings} 
                        disabled={updateProjectMutation.isPending}
                        className="gap-2"
                        data-testid="button-save-settings"
                      >
                        <Save className="w-4 h-4" />
                        {updateProjectMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Project Type</Label>
                          <Select 
                            value={projectSettings.projectType} 
                            onValueChange={(v) => setProjectSettings({ ...projectSettings, projectType: v })}
                          >
                            <SelectTrigger data-testid="select-settings-project-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new_website">New Website</SelectItem>
                              <SelectItem value="redesign">Website Redesign</SelectItem>
                              <SelectItem value="landing_page">Landing Page</SelectItem>
                              <SelectItem value="ecommerce">E-commerce</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Project Status</Label>
                          <Select 
                            value={projectSettings.status} 
                            onValueChange={(v) => setProjectSettings({ ...projectSettings, status: v })}
                          >
                            <SelectTrigger data-testid="select-settings-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created">Phase 1: Client Setup</SelectItem>
                              <SelectItem value="questionnaire_pending">Phase 2: Questionnaire Pending</SelectItem>
                              <SelectItem value="questionnaire_complete">Phase 2: Questionnaire Complete</SelectItem>
                              <SelectItem value="tos_pending">Phase 3: TOS Pending</SelectItem>
                              <SelectItem value="tos_signed">Phase 3: TOS Signed</SelectItem>
                              <SelectItem value="in_development">Phase 4: In Development</SelectItem>
                              <SelectItem value="hosting_setup">Phase 5: Hosting Setup</SelectItem>
                              <SelectItem value="deployed">Phase 5: Deployed</SelectItem>
                              <SelectItem value="delivery">Phase 6: Final Delivery</SelectItem>
                              <SelectItem value="client_review">Phase 6: Client Review</SelectItem>
                              <SelectItem value="completed">Phase 7: Completed</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Total Cost ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={projectSettings.totalCost}
                            onChange={(e) => setProjectSettings({ ...projectSettings, totalCost: e.target.value })}
                            placeholder="5000.00"
                            data-testid="input-settings-total-cost"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Structure</Label>
                          <Select 
                            value={projectSettings.paymentStructure} 
                            onValueChange={(v) => setProjectSettings({ ...projectSettings, paymentStructure: v })}
                          >
                            <SelectTrigger data-testid="select-settings-payment-structure">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="50_50">50% Deposit / 50% Completion</SelectItem>
                              <SelectItem value="full_upfront">Full Payment Upfront</SelectItem>
                              <SelectItem value="custom">Custom Schedule</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website Configuration
                      </CardTitle>
                      <CardDescription>Domain and hosting settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Domain Name</Label>
                          <Input
                            value={projectSettings.domain}
                            onChange={(e) => setProjectSettings({ ...projectSettings, domain: e.target.value })}
                            placeholder="example.com"
                            data-testid="input-settings-domain"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hosting Provider</Label>
                          <Input
                            value={projectSettings.hosting}
                            onChange={(e) => setProjectSettings({ ...projectSettings, hosting: e.target.value })}
                            placeholder="Vercel, Netlify, etc."
                            data-testid="input-settings-hosting"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" />
                          Client Questionnaire
                        </CardTitle>
                        <CardDescription>Track client questionnaire completion status</CardDescription>
                      </div>
                      {client.projects[0]?.questionnaireStatus === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("auth_token");
                              const res = await fetch(`/api/admin/clients/${clientId}/questionnaire/pdf`, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (!res.ok) throw new Error("Failed to fetch PDF");
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to download questionnaire PDF.",
                                variant: "destructive",
                              });
                            }
                          }}
                          data-testid="button-download-questionnaire"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                      {client.projects[0]?.questionnaireStatus !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("auth_token");
                              const res = await fetch(`/api/admin/clients/${clientId}/send-reminder`, {
                                method: "POST",
                                headers: { 
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ type: "questionnaire" }),
                              });
                              if (res.ok) {
                                toast({
                                  title: "Reminder Sent",
                                  description: "Questionnaire reminder has been sent to the client.",
                                });
                              } else {
                                throw new Error("Failed to send reminder");
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to send questionnaire reminder.",
                                variant: "destructive",
                              });
                            }
                          }}
                          data-testid="button-send-questionnaire-reminder"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Reminder
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">Questionnaire Status</p>
                          <p className="text-sm text-muted-foreground">
                            {client.projects[0]?.questionnaireStatus === "completed" 
                              ? "Client has completed the questionnaire" 
                              : client.projects[0]?.questionnaireStatus === "in_progress"
                              ? "Client is working on the questionnaire"
                              : "Client has not started the questionnaire"}
                          </p>
                        </div>
                        <Badge className={
                          client.projects[0]?.questionnaireStatus === "completed" 
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : client.projects[0]?.questionnaireStatus === "in_progress"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        }>
                          {client.projects[0]?.questionnaireStatus?.replace(/_/g, " ") || "Not Started"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          <FileSignature className="w-4 h-4" />
                          Terms of Service
                        </CardTitle>
                        <CardDescription>Preview and send TOS agreement to client</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {["tos_signed", "in_development", "hosting_setup", "deployed", "delivery", "client_review", "completed"].includes(client.projects[0]?.status || "") ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("auth_token");
                                const res = await fetch(`/api/admin/clients/${clientId}/tos/signed-pdf`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                if (!res.ok) throw new Error("Failed to download signed PDF");
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `tos-signed-${client.businessLegalName?.replace(/[^a-zA-Z0-9]/g, "_") || "client"}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to download signed TOS PDF.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="button-download-signed-tos"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Signed PDF
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("auth_token");
                                const res = await fetch(`/api/admin/clients/${clientId}/tos/pdf`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                if (!res.ok) throw new Error("Failed to fetch PDF");
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to preview TOS PDF.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="button-preview-tos"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        )}
                        {client.projects[0]?.questionnaireStatus === "completed" && 
                         !["tos_pending", "tos_signed", "in_development", "hosting_setup", "deployed", "delivery", "client_review", "completed"].includes(client.projects[0]?.status || "") && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("auth_token");
                                const res = await fetch(`/api/admin/clients/${clientId}/tos/send`, {
                                  method: "POST",
                                  headers: { 
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                });
                                if (res.ok) {
                                  toast({
                                    title: "TOS Sent",
                                    description: "Terms of Service has been sent to the client for signing.",
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
                                } else {
                                  throw new Error("Failed to send TOS");
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to send Terms of Service.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="button-send-tos"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send to Client
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">TOS Status</p>
                          <p className="text-sm text-muted-foreground">
                            {["tos_signed", "in_development", "hosting_setup", "deployed", "delivery", "client_review", "completed"].includes(client.projects[0]?.status || "")
                              ? "Client has signed the Terms of Service" 
                              : client.projects[0]?.status === "tos_pending"
                              ? "Waiting for client to sign"
                              : client.projects[0]?.questionnaireStatus === "completed"
                              ? "Ready to send - questionnaire completed"
                              : "Cannot send - questionnaire not completed"}
                          </p>
                        </div>
                        <Badge className={
                          ["tos_signed", "in_development", "hosting_setup", "deployed", "delivery", "client_review", "completed"].includes(client.projects[0]?.status || "")
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : client.projects[0]?.status === "tos_pending"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        }>
                          {["tos_signed", "in_development", "hosting_setup", "deployed", "delivery", "client_review", "completed"].includes(client.projects[0]?.status || "")
                            ? "Signed"
                            : client.projects[0]?.status === "tos_pending"
                            ? "Pending Signature"
                            : "Not Sent"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Special Requirements
                      </CardTitle>
                      <CardDescription>Additional notes and requirements for this project</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={projectSettings.specialRequirements}
                        onChange={(e) => setProjectSettings({ ...projectSettings, specialRequirements: e.target.value })}
                        placeholder="Enter any special requirements, notes, or client-specific instructions..."
                        className="min-h-24"
                        data-testid="textarea-settings-requirements"
                      />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Settings className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No project found for this client.</p>
                      <p className="text-sm text-muted-foreground mt-2">Create a project first to configure settings.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Projects
                  </CardTitle>
                  <CardDescription>{client.projects?.length || 0} total projects</CardDescription>
                </div>
                <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-add-project">
                      <Plus className="w-4 h-4" />
                      Add Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>Add a new project for this client</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Project Type *</Label>
                        <Select value={newProject.projectType} onValueChange={(v) => setNewProject({ ...newProject, projectType: v })}>
                          <SelectTrigger data-testid="select-project-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new_website">New Website</SelectItem>
                            <SelectItem value="redesign">Website Redesign</SelectItem>
                            <SelectItem value="landing_page">Landing Page</SelectItem>
                            <SelectItem value="ecommerce">E-commerce</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newProject.projectType === "other" && (
                        <div className="space-y-2">
                          <Label>Project Description *</Label>
                          <Input
                            value={newProject.projectTypeOther}
                            onChange={(e) => setNewProject({ ...newProject, projectTypeOther: e.target.value })}
                            placeholder="Describe the project"
                            data-testid="input-project-other"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Total Cost *</Label>
                        <Input
                          type="number"
                          value={newProject.totalCost}
                          onChange={(e) => setNewProject({ ...newProject, totalCost: e.target.value })}
                          placeholder="5000"
                          required
                          data-testid="input-project-cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Structure</Label>
                        <Select value={newProject.paymentStructure} onValueChange={(v) => setNewProject({ ...newProject, paymentStructure: v })}>
                          <SelectTrigger data-testid="select-payment-structure">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50_50">50% Deposit / 50% Completion</SelectItem>
                            <SelectItem value="full_upfront">Full Payment Upfront</SelectItem>
                            <SelectItem value="custom">Custom Schedule</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Special Requirements</Label>
                        <Textarea
                          value={newProject.specialRequirements}
                          onChange={(e) => setNewProject({ ...newProject, specialRequirements: e.target.value })}
                          placeholder="Any special requirements or notes..."
                          data-testid="input-project-requirements"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createProjectMutation.isPending} data-testid="button-submit-project">
                          {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {client.projects?.length > 0 ? (
                  <div className="space-y-4">
                    {client.projects.map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`project-${project.id}`}>
                        <div>
                          <p className="font-medium">
                            {project.projectType === "other" ? project.projectTypeOther : project.projectType?.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">${project.totalCost}</p>
                        </div>
                        <Badge className={statusColors[project.status] || statusColors.pending_payment}>
                          {project.status?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No projects yet. Click "Add Project" to create one.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Payments
                  </CardTitle>
                  <CardDescription>{client.payments?.length || 0} total payments</CardDescription>
                </div>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-add-payment">
                      <Plus className="w-4 h-4" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Payment</DialogTitle>
                      <DialogDescription>Add a payment for this client to pay through their portal</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePayment} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input
                          value={newPayment.description}
                          onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                          placeholder="e.g., Initial Deposit"
                          required
                          data-testid="input-payment-description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                          placeholder="2500"
                          required
                          data-testid="input-payment-amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={newPayment.dueDate}
                          onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                          data-testid="input-payment-duedate"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createPaymentMutation.isPending} data-testid="button-submit-payment">
                          {createPaymentMutation.isPending ? "Creating..." : "Create Payment"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {client.payments?.length > 0 ? (
                  <div className="space-y-4">
                    {client.payments.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`payment-${payment.id}`}>
                        <div>
                          <p className="font-medium">{payment.description || "Payment"}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.dueDate ? format(new Date(payment.dueDate), "MMM d, yyyy") : "No due date"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${payment.amount}</p>
                          <Badge className={paymentStatusColors[payment.status] || paymentStatusColors.pending}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No payments yet. Click "Add Payment" to create one.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents
                  </CardTitle>
                  <CardDescription>{client.documents?.length || 0} total documents</CardDescription>
                </div>
                <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-add-document">
                      <Upload className="w-4 h-4" />
                      Add Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={(newDocument.requiresSignature && (newDocument.fileUrl || tosPdfDataUrl)) ? "max-w-4xl" : undefined}>
                    <DialogHeader>
                      <DialogTitle>Create New Document</DialogTitle>
                      <DialogDescription>Add a document for this client to view/sign in their portal</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDocument} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Document Title *</Label>
                        <Input
                          value={newDocument.title}
                          onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                          placeholder="e.g., Project Contract"
                          required
                          data-testid="input-document-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select 
                          value={newDocument.documentType} 
                          onValueChange={async (v) => {
                            if (v === "terms_of_service") {
                              setNewDocument({ 
                                ...newDocument, 
                                documentType: v, 
                                title: "Terms of Service",
                                description: "Terms of Service agreement for web design services",
                                requiresSignature: true,
                                signatureFields: [{
                                  id: "client-signature",
                                  page: 1,
                                  x: 72,
                                  y: 650,
                                  width: 200,
                                  height: 50,
                                  label: "Client Signature"
                                }]
                              });
                              setIsGeneratingTos(true);
                              try {
                                const token = localStorage.getItem("auth_token");
                                const res = await fetch(`/api/admin/clients/${clientId}/tos/preview`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  const blob = await res.blob();
                                  const dataUrl = await new Promise<string>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result as string);
                                    reader.readAsDataURL(blob);
                                  });
                                  setTosPdfDataUrl(dataUrl);
                                }
                              } catch (err) {
                                console.error("Failed to generate TOS preview:", err);
                              } finally {
                                setIsGeneratingTos(false);
                              }
                            } else {
                              setNewDocument({ ...newDocument, documentType: v });
                              setTosPdfDataUrl(null);
                            }
                          }}
                        >
                          <SelectTrigger data-testid="select-document-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="terms_of_service">Terms of Service (auto-generated)</SelectItem>
                            <SelectItem value="contract">Contract (requires signature)</SelectItem>
                            <SelectItem value="upload">Upload (for review)</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="deliverable">Deliverable</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newDocument.description}
                          onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                          placeholder="Document description..."
                          data-testid="input-document-description"
                        />
                      </div>
                      {newDocument.documentType === "terms_of_service" ? (
                        <div className="space-y-2">
                          <Label>Terms of Service Document</Label>
                          {isGeneratingTos ? (
                            <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                              <span className="text-sm text-muted-foreground">Generating TOS document...</span>
                            </div>
                          ) : tosPdfDataUrl ? (
                            <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                              <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Terms of Service document generated. Add signature field below.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/20">
                              <p className="text-sm text-amber-700 dark:text-amber-400">
                                Select "Terms of Service" to auto-generate the document
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Upload Document (PDF, DOC, DOCX)</Label>
                          <FileUploader
                            accept=".pdf,.doc,.docx"
                            maxSize={52428800}
                            buttonLabel={uploadedFileName ? `Replace: ${uploadedFileName}` : "Choose File"}
                            disabled={isUploading}
                            onUpload={async (file) => {
                              setIsUploading(true);
                              try {
                                const res = await apiRequest("POST", "/api/admin/documents/upload-url", { 
                                  filename: file.name 
                                });
                                const { uploadURL, objectPath } = await res.json();
                                
                                await fetch(uploadURL, {
                                  method: "PUT",
                                  body: file,
                                  headers: {
                                    "Content-Type": file.type || "application/octet-stream",
                                  },
                                });
                                
                                return { url: objectPath, objectPath };
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                            onComplete={(result) => {
                              setNewDocument({ ...newDocument, fileUrl: result.objectPath });
                              setUploadedFileName(result.file.name);
                              toast({ title: "File uploaded", description: `${result.file.name} uploaded successfully` });
                            }}
                          />
                          {uploadedFileName && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Uploaded: {uploadedFileName}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requires-signature">Requires Signature</Label>
                        <Switch
                          id="requires-signature"
                          checked={newDocument.requiresSignature}
                          onCheckedChange={(checked) => setNewDocument({ ...newDocument, requiresSignature: checked, signatureFields: checked ? newDocument.signatureFields : [] })}
                          data-testid="switch-requires-signature"
                        />
                      </div>
                      {newDocument.requiresSignature && (
                        <PDFSignatureEditor
                          pdfUrl={newDocument.documentType === "terms_of_service" ? tosPdfDataUrl : (newDocument.fileUrl || null)}
                          signatureFields={newDocument.signatureFields}
                          onFieldsChange={(fields) => setNewDocument({ ...newDocument, signatureFields: fields })}
                        />
                      )}
                      {newDocument.documentType === "upload" && !newDocument.requiresSignature && (
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="requires-acknowledgment">Requires Acknowledgment</Label>
                            <p className="text-xs text-muted-foreground">Client must confirm they reviewed the document</p>
                          </div>
                          <Switch
                            id="requires-acknowledgment"
                            checked={newDocument.requiresAcknowledgment}
                            onCheckedChange={(checked) => setNewDocument({ ...newDocument, requiresAcknowledgment: checked })}
                            data-testid="switch-requires-acknowledgment"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="visible-to-client">Visible to Client</Label>
                        <Switch
                          id="visible-to-client"
                          checked={newDocument.visibleToClient}
                          onCheckedChange={(checked) => setNewDocument({ ...newDocument, visibleToClient: checked })}
                          data-testid="switch-visible-to-client"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>Cancel</Button>
                        <Button 
                          type="submit" 
                          disabled={createDocumentMutation.isPending || sendTosMutation.isPending || isGeneratingTos} 
                          data-testid="button-submit-document"
                        >
                          {createDocumentMutation.isPending || sendTosMutation.isPending 
                            ? (newDocument.documentType === "terms_of_service" ? "Sending..." : "Creating...") 
                            : (newDocument.documentType === "terms_of_service" ? "Send for Signing" : "Create Document")}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {client.documents?.length > 0 ? (
                  <div className="space-y-4">
                    {client.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`document-${doc.id}`}>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">{doc.documentType}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!doc.visibleToClient && <Badge variant="outline">Hidden</Badge>}
                          {doc.requiresSignature && (
                            <Badge variant={doc.isSigned ? "default" : "secondary"}>
                              {doc.isSigned ? "Signed" : "Pending Signature"}
                            </Badge>
                          )}
                          {doc.isSigned && doc.signatureData && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" data-testid={`button-view-signature-${doc.id}`}>
                                  <FileSignature className="w-4 h-4 mr-2" />
                                  View Signature
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="font-serif">Signature for {doc.title}</DialogTitle>
                                  <DialogDescription>
                                    Signed on {doc.signedAt ? format(new Date(doc.signedAt), "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="border rounded-lg p-4 bg-white">
                                    {doc.signatureType === "drawn" ? (
                                      <img src={doc.signatureData} alt="Signature" className="max-w-full h-auto" />
                                    ) : (
                                      <p className="text-2xl font-signature text-center" style={{ fontFamily: "cursive" }}>
                                        {doc.signatureData}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p>Type: {doc.signatureType === "drawn" ? "Hand-drawn" : "Typed"}</p>
                                    {doc.signedByIp && <p>IP Address: {doc.signedByIp}</p>}
                                  </div>
                                  <Button 
                                    onClick={() => saveSignatureMutation.mutate(doc.id)}
                                    disabled={saveSignatureMutation.isPending}
                                    className="w-full"
                                    data-testid={`button-save-signature-${doc.id}`}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saveSignatureMutation.isPending ? "Saving..." : "Save to Client Profile"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No documents yet. Click "Add Document" to create one.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploads" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Client Uploaded Files
                </CardTitle>
                <CardDescription>Files uploaded by the client for their project</CardDescription>
              </CardHeader>
              <CardContent>
                {client.uploads?.length > 0 ? (
                  <div className="space-y-4">
                    {client.uploads.map((upload: any) => (
                      <div key={upload.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`upload-${upload.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Upload className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{upload.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {upload.category} {upload.description && `- ${upload.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{upload.category}</Badge>
                          {upload.fileUrl && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={upload.fileUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-upload-${upload.id}`}>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No files uploaded by client yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.activity?.length > 0 ? (
                  <div className="space-y-4">
                    {client.activity.slice(0, 10).map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border" data-testid={`activity-${log.id}`}>
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <p className="text-sm">{log.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No activity yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
