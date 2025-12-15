import { useState } from "react";
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
  Check
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  design_review: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  development: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  client_review: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  revisions: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_hold: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
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
    requiresSignature: false,
    visibleToClient: true,
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
      setNewDocument({ title: "", documentType: "contract", description: "", requiresSignature: false, visibleToClient: true });
      toast({ title: "Document created", description: "New document has been added for this client." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create document", description: error.message, variant: "destructive" });
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
    createDocumentMutation.mutate(newDocument);
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

        <Tabs defaultValue="projects" className="w-full">
          <TabsList>
            <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          </TabsList>

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
                  <DialogContent>
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
                        <Select value={newDocument.documentType} onValueChange={(v) => setNewDocument({ ...newDocument, documentType: v })}>
                          <SelectTrigger data-testid="select-document-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requires-signature">Requires Signature</Label>
                        <Switch
                          id="requires-signature"
                          checked={newDocument.requiresSignature}
                          onCheckedChange={(checked) => setNewDocument({ ...newDocument, requiresSignature: checked })}
                          data-testid="switch-requires-signature"
                        />
                      </div>
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
                        <Button type="submit" disabled={createDocumentMutation.isPending} data-testid="button-submit-document">
                          {createDocumentMutation.isPending ? "Creating..." : "Create Document"}
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
