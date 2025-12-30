import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Check,
  Lock,
  AlertCircle,
  ChevronRight,
  User,
  ClipboardList,
  FileText,
  Palette,
  Code,
  Eye,
  Rocket,
  Shield,
  SkipForward,
  Send,
  RefreshCw,
  Upload,
  ExternalLink,
  Mail,
  Calendar,
  DollarSign,
  Building2,
  Phone,
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  KeyRound,
  MessageSquare,
  Pencil,
  Save,
  Trash2,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PortalLayout } from "@/components/portal/portal-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Phase configuration
const PHASES = [
  { 
    id: 1, 
    name: "Client Onboarding", 
    icon: User,
    statuses: ["draft", "created"],
    description: "Create client account and send welcome email"
  },
  { 
    id: 2, 
    name: "Questionnaire", 
    icon: ClipboardList,
    statuses: ["questionnaire_pending", "questionnaire_complete"],
    description: "Client completes project questionnaire"
  },
  { 
    id: 3, 
    name: "Agreement & Quote", 
    icon: FileText,
    statuses: ["tos_pending", "tos_signed", "quote_draft", "quote_sent", "quote_approved", "deposit_pending", "deposit_paid"],
    description: "TOS signature, quote approval, and 50% deposit"
  },
  { 
    id: 4, 
    name: "Design", 
    icon: Palette,
    statuses: ["design_pending", "design_sent", "design_approved"],
    description: "Template selection and design approval"
  },
  { 
    id: 5, 
    name: "Development", 
    icon: Code,
    statuses: ["in_development"],
    description: "Website actively being built"
  },
  { 
    id: 6, 
    name: "Ready for Review", 
    icon: Eye,
    statuses: ["ready_for_review"],
    description: "Development complete, client preview"
  },
  { 
    id: 7, 
    name: "Review & Delivery", 
    icon: Rocket,
    statuses: ["client_review", "revisions_pending", "revisions_complete", "awaiting_final_payment", "payment_complete", "hosting_setup_pending", "hosting_configured", "completed"],
    description: "Final review, payment, and handover"
  },
];

const getPhaseFromStatus = (status: string): number => {
  if (status === "on_hold" || status === "cancelled") return 0;
  for (const phase of PHASES) {
    if (phase.statuses.includes(status)) return phase.id;
  }
  return 1;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: "Draft - Not Sent",
    created: "Welcome Email Sent",
    questionnaire_pending: "Awaiting Questionnaire",
    questionnaire_complete: "Questionnaire Complete",
    quote_draft: "Quote Draft",
    quote_sent: "Quote Sent",
    quote_approved: "Quote Approved",
    tos_pending: "Awaiting TOS Signature",
    tos_signed: "TOS Signed",
    deposit_pending: "Awaiting Deposit",
    deposit_paid: "Deposit Received",
    design_pending: "Design Pending",
    design_sent: "Design Options Sent",
    design_approved: "Design Approved",
    in_development: "In Development",
    ready_for_review: "Ready for Review",
    client_review: "Client Reviewing",
    revisions_pending: "Revisions Requested",
    revisions_complete: "Revisions Complete",
    awaiting_final_payment: "Awaiting Final Payment",
    payment_complete: "Payment Complete",
    hosting_setup_pending: "Hosting Setup Pending",
    hosting_configured: "Hosting Configured",
    completed: "Project Complete",
    on_hold: "On Hold",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

const pulseAnimation = {
  animate: { 
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  }
};

export default function ProjectWorkflow() {
  const { toast } = useToast();
  const [, params] = useRoute("/admin/clients/:id/workflow");
  const clientId = params?.id;
  
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipToPhase, setSkipToPhase] = useState<number | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: client, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/clients", clientId],
    enabled: !!clientId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Status updated", description: "Project phase has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const sendWelcomeEmailMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiRequest("POST", `/api/admin/projects/${projectId}/send-welcome`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Welcome email sent", description: "Client has received their login credentials." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send email", description: error.message, variant: "destructive" });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ projectId, type }: { projectId: string; type: string }) => {
      const res = await apiRequest("POST", `/api/admin/projects/${projectId}/send-reminder`, { type });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Reminder sent", description: `${variables.type} reminder email has been sent.` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reminder", description: error.message, variant: "destructive" });
    },
  });

  const uploadTemplatesMutation = useMutation({
    mutationFn: async ({ projectId, templateUrls }: { projectId: string; templateUrls: string[] }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}`, { 
        designTemplateUrls: JSON.stringify(templateUrls),
        designTemplatesSentAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Templates saved", description: "Design templates have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save templates", description: error.message, variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Project updated", description: "Changes have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { clientId: string; projectId: string; amount: string; description: string; paymentType: string }) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      const res = await apiRequest("POST", "/api/admin/payments", {
        clientId: data.clientId,
        projectId: data.projectId,
        description: data.description,
        amount: data.amount,
        paymentType: data.paymentType,
        dueDate: dueDate.toISOString().split('T')[0],
        status: "pending",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Invoice sent", description: "The client can now pay through their portal." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create invoice", description: error.message, variant: "destructive" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/clients/${clientId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Client updated", description: "Contact information has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/admin/pin/verify", { pin });
      return res.json();
    },
    onSuccess: () => {
      if (skipToPhase && client?.projects?.[0]) {
        const project = client.projects[0];
        const targetPhase = PHASES.find(p => p.id === skipToPhase);
        if (targetPhase) {
          updateStatusMutation.mutate({ 
            projectId: project.id, 
            status: targetPhase.statuses[0] 
          });
        }
      }
      setSkipModalOpen(false);
      setPinValue("");
      setPinError("");
      setSkipToPhase(null);
    },
    onError: (error: Error) => {
      setPinError("Invalid PIN. Please try again.");
      setPinValue("");
    },
  });

  const handleSkipPhase = (targetPhase: number) => {
    setSkipToPhase(targetPhase);
    setSkipModalOpen(true);
    setPinValue("");
    setPinError("");
  };

  const handleVerifyPin = () => {
    if (pinValue.length !== 5) {
      setPinError("Please enter your 5-digit PIN");
      return;
    }
    setIsVerifying(true);
    verifyPinMutation.mutate(pinValue, {
      onSettled: () => setIsVerifying(false),
    });
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div 
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading project...</p>
          </motion.div>
        </div>
      </PortalLayout>
    );
  }

  if (!client) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p>Client not found</p>
              <Link href="/admin/clients">
                <Button variant="outline">Back to Clients</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  const project = client.projects?.[0];
  const currentPhase = project ? getPhaseFromStatus(project.status) : 1;
  const user = client.user;

  return (
    <PortalLayout>
      <motion.div 
        className="space-y-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.businessLegalName}</h1>
              {project && (
                <Badge 
                  className={
                    project.status === "completed" 
                      ? "bg-green-500/10 text-green-600" 
                      : project.status === "on_hold"
                      ? "bg-amber-500/10 text-amber-600"
                      : project.status === "cancelled"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-primary/10 text-primary"
                  }
                >
                  {getStatusLabel(project.status)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {user?.firstName} {user?.lastName} • {user?.email}
            </p>
          </div>
        </motion.div>

        {/* Phase Progress Timeline */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Project Workflow
              </CardTitle>
              <CardDescription>
                Follow the 7-phase development process. Complete each phase before moving to the next.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-muted rounded-full">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentPhase - 1) / 6) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>

                {/* Phase Steps */}
                <div className="flex justify-between relative">
                  {PHASES.map((phase, index) => {
                    const isComplete = currentPhase > phase.id;
                    const isCurrent = currentPhase === phase.id;
                    const isLocked = currentPhase < phase.id;
                    const Icon = phase.icon;

                    return (
                      <motion.div 
                        key={phase.id}
                        className="flex flex-col items-center w-24"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <motion.div
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center relative z-10
                            transition-all duration-300
                            ${isComplete 
                              ? "bg-green-500 text-white" 
                              : isCurrent 
                              ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                              : "bg-muted text-muted-foreground"
                            }
                          `}
                          whileHover={isCurrent ? { scale: 1.1 } : {}}
                          {...(isCurrent ? pulseAnimation : {})}
                        >
                          {isComplete ? (
                            <Check className="w-5 h-5" />
                          ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </motion.div>
                        <span className={`
                          mt-2 text-xs text-center font-medium
                          ${isCurrent ? "text-primary" : isComplete ? "text-green-600" : "text-muted-foreground"}
                        `}>
                          {phase.name}
                        </span>
                        {isLocked && currentPhase < phase.id && currentPhase > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-xs h-6 px-2"
                            onClick={() => handleSkipPhase(phase.id)}
                            data-testid={`button-skip-to-phase-${phase.id}`}
                          >
                            <SkipForward className="w-3 h-3 mr-1" />
                            Skip
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Phase Content */}
        <AnimatePresence mode="wait">
          {project && (
            <motion.div
              key={currentPhase}
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {currentPhase === 1 && (
                <Phase1Content 
                  client={client} 
                  project={project}
                  onSendWelcome={() => sendWelcomeEmailMutation.mutate(project.id)}
                  isSending={sendWelcomeEmailMutation.isPending}
                />
              )}
              {currentPhase === 2 && (
                <Phase2Content 
                  client={client} 
                  project={project}
                  onSendReminder={() => sendReminderMutation.mutate({ projectId: project.id, type: "questionnaire" })}
                  onAdvancePhase={() => updateStatusMutation.mutate({ projectId: project.id, status: "tos_pending" })}
                  isSendingReminder={sendReminderMutation.isPending}
                  onResendWelcome={() => sendWelcomeEmailMutation.mutate(project.id)}
                  isResending={sendWelcomeEmailMutation.isPending}
                  onUpdateClient={(data: any) => updateClientMutation.mutate(data)}
                  isUpdating={updateClientMutation.isPending}
                />
              )}
              {currentPhase === 3 && (
                <Phase3Content 
                  client={client} 
                  project={project}
                  onAdvancePhase={(status: string) => updateStatusMutation.mutate({ projectId: project.id, status })}
                  onSendReminder={(type: string) => sendReminderMutation.mutate({ projectId: project.id, type })}
                  isSendingReminder={sendReminderMutation.isPending}
                  isUpdating={updateStatusMutation.isPending || updateProjectMutation.isPending}
                  onCreateDeposit={(data: { amount: string; description: string; paymentType: string }) => 
                    createPaymentMutation.mutate({ 
                      clientId: client.id, 
                      projectId: project.id, 
                      ...data 
                    })
                  }
                  onUpdateProject={(data: any) => updateProjectMutation.mutate({ projectId: project.id, data })}
                />
              )}
              {currentPhase === 4 && (
                <Phase4Content 
                  client={client} 
                  project={project}
                  onAdvancePhase={(status: string) => updateStatusMutation.mutate({ projectId: project.id, status })}
                  onUploadTemplates={(urls: string[]) => uploadTemplatesMutation.mutate({ projectId: project.id, templateUrls: urls })}
                  isUpdating={updateStatusMutation.isPending}
                  isUploading={uploadTemplatesMutation.isPending}
                />
              )}
              {currentPhase === 5 && (
                <Phase5Content 
                  client={client} 
                  project={project}
                  onAdvancePhase={(status: string) => updateStatusMutation.mutate({ projectId: project.id, status })}
                  onUpdateProject={(data: any) => updateProjectMutation.mutate({ projectId: project.id, data })}
                  isUpdating={updateStatusMutation.isPending || updateProjectMutation.isPending}
                />
              )}
              {currentPhase === 6 && (
                <Phase6Content 
                  client={client} 
                  project={project}
                  onAdvancePhase={(status: string) => updateStatusMutation.mutate({ projectId: project.id, status })}
                  onSendReminder={() => sendReminderMutation.mutate({ projectId: project.id, type: "review" })}
                  isUpdating={updateStatusMutation.isPending}
                  isSendingReminder={sendReminderMutation.isPending}
                />
              )}
              {currentPhase === 7 && (
                <Phase7Content 
                  client={client} 
                  project={project}
                  payments={client?.payments || []}
                  onAdvancePhase={(status: string) => updateStatusMutation.mutate({ projectId: project.id, status })}
                  onCreatePayment={(data: any) => createPaymentMutation.mutate(data)}
                  isUpdating={updateStatusMutation.isPending}
                  isCreatingPayment={createPaymentMutation.isPending}
                />
              )}
              {currentPhase === 0 && (
                <SpecialStateContent client={client} project={project} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Phase PIN Modal */}
        <Dialog open={skipModalOpen} onOpenChange={setSkipModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Verify PIN to Skip Phase
              </DialogTitle>
              <DialogDescription>
                Skipping phases should only be done in special circumstances. 
                Enter your 5-digit PIN to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <InputOTP 
                maxLength={5} 
                value={pinValue}
                onChange={setPinValue}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                </InputOTPGroup>
              </InputOTP>
              {pinError && (
                <motion.p 
                  className="text-sm text-destructive"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {pinError}
                </motion.p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSkipModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyPin}
                disabled={isVerifying || pinValue.length !== 5}
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Verify & Skip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </PortalLayout>
  );
}

// Phase 1: Client Onboarding
function Phase1Content({ client, project, onSendWelcome, isSending }: any) {
  const user = client.user;
  const isDraft = project.status === "draft";
  const isCreated = project.status === "created";

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Phase 1: Client Onboarding
          </CardTitle>
          <CardDescription>
            {isDraft 
              ? "Review client information and send welcome email with login credentials."
              : "Welcome email has been sent. Waiting for client to complete questionnaire."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business Name</span>
                  <span className="font-medium">{client.businessLegalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium">{client.industry || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Website</span>
                  <span className="font-medium">{client.existingWebsite || "None"}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Primary Contact
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{user?.phone || client.businessPhone || "Not provided"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Action */}
          <div className="border-t pt-6">
            {isDraft ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-amber-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Ready to Send Welcome Email</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    This will create the client's login credentials and invite them to complete the questionnaire.
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={onSendWelcome}
                  disabled={isSending}
                  className="gap-2"
                  data-testid="button-send-welcome"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Welcome Email
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <motion.div 
                  className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </motion.div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Welcome Email Sent</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Client has been invited to complete the questionnaire. Waiting for their response.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={onSendWelcome}
                    disabled={isSending}
                    data-testid="button-resend-welcome"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Resend Welcome Email
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 2: Questionnaire
function Phase2Content({ client, project, onSendReminder, onAdvancePhase, isSendingReminder, onResendWelcome, isResending, onUpdateClient, isUpdating }: any) {
  const user = client.user;
  const isPending = project.status === "questionnaire_pending";
  const isComplete = project.status === "questionnaire_complete";
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    businessLegalName: client.businessLegalName || "",
    businessPhone: client.businessPhone || "",
    businessEmail: client.businessEmail || "",
    industry: client.industry || "",
    existingWebsite: client.existingWebsite || "",
    addressStreet: client.addressStreet || "",
    addressCity: client.addressCity || "",
    addressState: client.addressState || "",
    addressZip: client.addressZip || "",
  });

  const handleSaveEdit = () => {
    onUpdateClient(editForm);
    setEditOpen(false);
  };

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Phase 2: Client Questionnaire
            </CardTitle>
            <CardDescription>
              {isPending 
                ? "Waiting for the client to complete their project questionnaire."
                : "Questionnaire completed! Review responses and proceed to quote creation."
              }
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setEditOpen(true)}
            data-testid="button-edit-client"
          >
            <Pencil className="w-4 h-4" />
            Edit Contact Info
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <motion.div 
                className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className="w-10 h-10 text-amber-600" />
              </motion.div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Awaiting Client Response</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  The questionnaire was sent on {project.createdAt ? format(new Date(project.createdAt), "MMM d, yyyy") : "N/A"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={onResendWelcome}
                  disabled={isResending}
                  data-testid="button-resend-welcome-phase2"
                >
                  {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Resend Welcome Email
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={onSendReminder}
                  disabled={isSendingReminder}
                  data-testid="button-send-reminder"
                >
                  {isSendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Reminder
                </Button>
                <Link href={`/admin/clients/${client.id}/questionnaire/pdf`} target="_blank">
                  <Button variant="outline" className="gap-2" data-testid="button-view-questionnaire">
                    <ExternalLink className="w-4 h-4" />
                    View Questionnaire
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Questionnaire Complete</p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Completed on {project.questionnaireCompletedAt ? format(new Date(project.questionnaireCompletedAt), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                  </p>
                </div>
              </div>
              
              {/* Questionnaire Response Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Project Goals</h4>
                  <p className="text-sm text-muted-foreground">{project.mainGoals || "Not specified"}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Target Audience</h4>
                  <p className="text-sm text-muted-foreground">{project.targetAudience || "Not specified"}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Design Style</h4>
                  <p className="text-sm text-muted-foreground capitalize">{project.designStyle || "Not specified"}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Site Type</h4>
                  <p className="text-sm text-muted-foreground capitalize">{project.siteType?.replace("_", " ") || "Not specified"}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Link href={`/admin/clients/${client.id}/questionnaire/pdf`} target="_blank">
                  <Button variant="outline" className="gap-2" data-testid="button-view-full-responses">
                    <ExternalLink className="w-4 h-4" />
                    View Full Responses
                  </Button>
                </Link>
                <Button className="gap-2" onClick={onAdvancePhase} data-testid="button-proceed-phase3">
                  Proceed to Agreement
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Contact Info Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
            <DialogDescription>
              Update the client's contact details and business information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Primary Contact */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Primary Contact
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    data-testid="input-edit-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    data-testid="input-edit-lastname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    data-testid="input-edit-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    data-testid="input-edit-phone"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="businessLegalName">Business Name</Label>
                  <Input
                    id="businessLegalName"
                    value={editForm.businessLegalName}
                    onChange={(e) => setEditForm({ ...editForm, businessLegalName: e.target.value })}
                    data-testid="input-edit-businessname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    value={editForm.businessPhone}
                    onChange={(e) => setEditForm({ ...editForm, businessPhone: e.target.value })}
                    data-testid="input-edit-businessphone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={editForm.businessEmail}
                    onChange={(e) => setEditForm({ ...editForm, businessEmail: e.target.value })}
                    data-testid="input-edit-businessemail"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    data-testid="input-edit-industry"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="existingWebsite">Existing Website</Label>
                  <Input
                    id="existingWebsite"
                    value={editForm.existingWebsite}
                    onChange={(e) => setEditForm({ ...editForm, existingWebsite: e.target.value })}
                    data-testid="input-edit-website"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Address
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="addressStreet">Street Address</Label>
                  <Input
                    id="addressStreet"
                    value={editForm.addressStreet}
                    onChange={(e) => setEditForm({ ...editForm, addressStreet: e.target.value })}
                    data-testid="input-edit-street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressCity">City</Label>
                  <Input
                    id="addressCity"
                    value={editForm.addressCity}
                    onChange={(e) => setEditForm({ ...editForm, addressCity: e.target.value })}
                    data-testid="input-edit-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressState">State</Label>
                  <Input
                    id="addressState"
                    value={editForm.addressState}
                    onChange={(e) => setEditForm({ ...editForm, addressState: e.target.value })}
                    data-testid="input-edit-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressZip">ZIP Code</Label>
                  <Input
                    id="addressZip"
                    value={editForm.addressZip}
                    onChange={(e) => setEditForm({ ...editForm, addressZip: e.target.value })}
                    data-testid="input-edit-zip"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating} data-testid="button-save-client">
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Phase 3: Agreement & Quote
function Phase3Content({ client, project, onAdvancePhase, onSendReminder, isSendingReminder, isUpdating, onCreateDeposit, onUpdateProject }: any) {
  const status = project.status;
  const [tosSent, setTosSent] = useState(false);
  const { toast } = useToast();
  
  // Full quote form state
  const [quoteForm, setQuoteForm] = useState({
    title: `Website Development - ${client.businessLegalName || "Project"}`,
    description: "",
    lineItems: [{ name: "Website Design & Development", description: "", quantity: 1, unitPrice: 0 }] as Array<{name: string; description: string; quantity: number; unitPrice: number}>,
    discountAmount: 0,
    discountDescription: "",
    taxRate: 0,
    validUntil: "",
    notes: "",
  });

  // Fetch existing quotes
  const { data: quotes, isLoading: quotesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/clients", client.id, "quotes"],
    enabled: !!client.id,
  });

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/clients/${client.id}/quotes`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", client.id, "quotes"] });
      toast({ title: "Quote created", description: "Quote has been created. Click 'Send to Client' to send it." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create quote", description: error.message, variant: "destructive" });
    },
  });

  // Send quote mutation
  const sendQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await apiRequest("POST", `/api/admin/quotes/${quoteId}/send`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", client.id, "quotes"] });
      toast({ title: "Quote sent", description: "Quote has been sent to the client." });
      onAdvancePhase("quote_sent");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send quote", description: error.message, variant: "destructive" });
    },
  });

  // New order: TOS → Quote → Deposit
  const statusOrder = ["tos_pending", "tos_signed", "quote_draft", "quote_sent", "quote_approved", "deposit_pending", "deposit_paid"];
  const currentIndex = statusOrder.indexOf(status);
  
  // Simplified progress indicator: check if step is complete based on current status
  const isStepComplete = (stepIndex: number) => {
    const thresholds = [1, 4, 6];
    return currentIndex >= thresholds[stepIndex];
  };

  // Quote form helpers
  const addLineItem = () => {
    setQuoteForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { name: "", description: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeLineItem = (index: number) => {
    if (quoteForm.lineItems.length <= 1) return;
    setQuoteForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    setQuoteForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateQuoteTotals = () => {
    const subtotal = quoteForm.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountedSubtotal = subtotal - quoteForm.discountAmount;
    const taxAmount = discountedSubtotal * (quoteForm.taxRate / 100);
    const total = discountedSubtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleCreateQuote = () => {
    const { subtotal, taxAmount, total } = calculateQuoteTotals();
    if (total <= 0) {
      toast({ title: "Invalid quote", description: "Please add at least one line item with a price.", variant: "destructive" });
      return;
    }
    createQuoteMutation.mutate({
      title: quoteForm.title,
      description: quoteForm.description,
      lineItems: quoteForm.lineItems,
      subtotal: subtotal.toFixed(2),
      discountAmount: quoteForm.discountAmount.toFixed(2),
      discountDescription: quoteForm.discountDescription,
      taxRate: quoteForm.taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: total.toFixed(2),
      validUntil: quoteForm.validUntil || null,
      notes: quoteForm.notes,
      termsAndConditions: "",
    });
  };

  const handleSendQuote = (quoteId: string) => {
    sendQuoteMutation.mutate(quoteId);
  };

  const handleQuoteApproval = async () => {
    // Find the approved quote's total
    const approvedQuote = quotes?.find((q: any) => q.status === "sent" || q.status === "viewed");
    const amount = parseFloat(approvedQuote?.totalAmount || project.totalCost || "0");
    const depositAmount = (amount / 2).toFixed(2);
    
    // Update project total cost
    if (onUpdateProject && amount > 0) {
      onUpdateProject({ totalCost: amount.toFixed(2) });
    }
    
    // Create deposit payment automatically
    if (onCreateDeposit && amount > 0) {
      onCreateDeposit({
        amount: depositAmount,
        description: "50% Project Deposit",
        paymentType: "deposit"
      });
    }
    
    onAdvancePhase("quote_approved");
  };

  const { subtotal, taxAmount, total } = calculateQuoteTotals();
  const draftQuotes = quotes?.filter((q: any) => q.status === "draft") || [];
  const sentQuotes = quotes?.filter((q: any) => q.status === "sent" || q.status === "viewed") || [];
  const approvedQuotes = quotes?.filter((q: any) => q.status === "approved") || [];
  
  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Phase 3: Agreement & Quote
          </CardTitle>
          <CardDescription>
            Send Terms of Service for signature, then create and send quote for approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mini Progress */}
          <div className="flex items-center gap-2">
            {["TOS Signed", "Quote Approved", "Deposit Paid"].map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${isStepComplete(i) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}
                `}>
                  {isStepComplete(i) ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs hidden sm:block">{step}</span>
                {i < 2 && <div className="flex-1 h-0.5 bg-muted" />}
              </div>
            ))}
          </div>

          {/* Content based on status */}
          <div className="border rounded-lg p-6">
            {/* Step 1: TOS Pending - Admin needs to send TOS */}
            {status === "tos_pending" && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <FileText className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="font-semibold text-lg">Send Terms of Service</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Before sending a quote, the client must sign the Terms of Service agreement.
                  </p>
                </div>
                
                {/* Admin Instructions */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200">Action Required</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        You must manually add a signature field to the TOS document before sending it to the client. 
                        Make sure the signature area is clearly marked.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Legal Notice */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">Legal Binding Notice</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Electronic signatures are legally binding under the ESIGN Act and UETA. 
                        The client's signature on the TOS has the same legal effect as a handwritten signature on paper.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  {!tosSent ? (
                    <Button 
                      className="gap-2" 
                      onClick={() => setTosSent(true)}
                      data-testid="button-confirm-tos-sent"
                    >
                      <Send className="w-4 h-4" />
                      I Have Sent the TOS
                    </Button>
                  ) : (
                    <div className="space-y-4 text-center max-w-md">
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 justify-center mb-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">TOS Sent</span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Waiting for client to sign the Terms of Service document.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Has the client signed the TOS?</p>
                        <p className="text-xs text-muted-foreground">
                          Only confirm after you have received the signed TOS document from the client. 
                          This action cannot be undone.
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => setTosSent(false)}
                          data-testid="button-back-tos"
                        >
                          Not Yet Signed
                        </Button>
                        <Button 
                          className="gap-2" 
                          onClick={() => onAdvancePhase("tos_signed")}
                          disabled={isUpdating}
                          data-testid="button-mark-tos-signed"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Confirm Client Signed
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: TOS Signed - Waiting for client signature */}
            {status === "tos_signed" && (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                </motion.div>
                <h3 className="font-semibold text-green-600">TOS Signed Successfully</h3>
                <p className="text-sm text-muted-foreground">
                  The client has signed the Terms of Service. You can now create and send the project quote.
                </p>
                <Button 
                  className="gap-2" 
                  onClick={() => onAdvancePhase("quote_draft")}
                  disabled={isUpdating}
                  data-testid="button-proceed-to-quote"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Proceed to Quote Creation
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Step 3: Quote Draft - Create the quote */}
            {status === "quote_draft" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="font-semibold text-lg">Create Project Quote</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a detailed quote with line items. Once saved, you can send it to the client.
                  </p>
                </div>

                {/* Show existing quotes */}
                {draftQuotes.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium">Draft Quotes Ready to Send:</p>
                    {draftQuotes.map((quote: any) => (
                      <div key={quote.id} className="flex items-center justify-between gap-4 p-3 bg-background rounded-lg border">
                        <div>
                          <p className="font-medium">{quote.title}</p>
                          <p className="text-sm text-muted-foreground">Total: ${quote.totalAmount}</p>
                        </div>
                        <Button 
                          className="gap-2" 
                          onClick={() => handleSendQuote(quote.id)}
                          disabled={sendQuoteMutation.isPending}
                          data-testid={`button-send-quote-${quote.id}`}
                        >
                          {sendQuoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Send to Client
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quote Form */}
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quote Title *</Label>
                      <Input
                        value={quoteForm.title}
                        onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })}
                        placeholder="e.g., Website Development Proposal"
                        data-testid="input-quote-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input
                        type="date"
                        value={quoteForm.validUntil}
                        onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                        data-testid="input-quote-valid-until"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={quoteForm.description}
                      onChange={(e) => setQuoteForm({ ...quoteForm, description: e.target.value })}
                      placeholder="Brief description of the quote..."
                      rows={2}
                      data-testid="input-quote-description"
                    />
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Line Items</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="gap-1" data-testid="button-add-line-item">
                        <Plus className="w-4 h-4" /> Add Item
                      </Button>
                    </div>
                    
                    {quoteForm.lineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                        <div className="col-span-4 space-y-1">
                          <Label className="text-xs">Item Name *</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => updateLineItem(index, "name", e.target.value)}
                            placeholder="e.g., Homepage Design"
                            data-testid={`input-line-item-name-${index}`}
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(index, "description", e.target.value)}
                            placeholder="Optional details"
                            data-testid={`input-line-item-desc-${index}`}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                            data-testid={`input-line-item-qty-${index}`}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Unit Price ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                            data-testid={`input-line-item-price-${index}`}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                            disabled={quoteForm.lineItems.length <= 1}
                            data-testid={`button-remove-line-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount and Tax */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={quoteForm.discountAmount}
                        onChange={(e) => setQuoteForm({ ...quoteForm, discountAmount: parseFloat(e.target.value) || 0 })}
                        data-testid="input-quote-discount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={quoteForm.taxRate}
                        onChange={(e) => setQuoteForm({ ...quoteForm, taxRate: parseFloat(e.target.value) || 0 })}
                        data-testid="input-quote-tax"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                      placeholder="Additional notes for the client..."
                      rows={2}
                      data-testid="input-quote-notes"
                    />
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {quoteForm.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-${quoteForm.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {quoteForm.taxRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax ({quoteForm.taxRate}%):</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    {total > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>50% Deposit:</span>
                        <span>${(total / 2).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline"
                      className="gap-2" 
                      onClick={handleCreateQuote}
                      disabled={createQuoteMutation.isPending || total <= 0 || !quoteForm.title}
                      data-testid="button-save-quote"
                    >
                      {createQuoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Quote as Draft
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Quote Sent - Waiting for approval */}
            {status === "quote_sent" && (
              <div className="text-center space-y-4">
                <Clock className="w-12 h-12 mx-auto text-amber-500" />
                <h3 className="font-semibold">Awaiting Quote Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Quote sent to client. Waiting for their approval on the client portal.
                </p>
                
                {/* Show sent quotes */}
                {sentQuotes.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto space-y-3">
                    <p className="text-sm font-medium">Pending Quotes:</p>
                    {sentQuotes.map((quote: any) => {
                      const lineItems = typeof quote.lineItems === 'string' ? JSON.parse(quote.lineItems) : quote.lineItems;
                      return (
                        <div key={quote.id} className="bg-background rounded-lg border p-3 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{quote.title}</p>
                            <Badge variant="outline">Awaiting Response</Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p>{lineItems?.length || 0} line items</p>
                          </div>
                          <div className="mt-2 border-t pt-2">
                            <p className="text-2xl font-bold text-primary">${quote.totalAmount}</p>
                            <p className="text-xs text-muted-foreground">
                              50% Deposit: ${(parseFloat(quote.totalAmount) / 2).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={() => onSendReminder("quote")}
                    disabled={isSendingReminder}
                    data-testid="button-send-quote-reminder"
                  >
                    {isSendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Reminder
                  </Button>
                  <Button 
                    className="gap-2" 
                    onClick={handleQuoteApproval}
                    disabled={isUpdating || sentQuotes.length === 0}
                    data-testid="button-mark-quote-approved"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Mark Quote Approved
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Quote Approved / Deposit Pending */}
            {(status === "quote_approved" || status === "deposit_pending") && (
              <div className="text-center space-y-4">
                <DollarSign className="w-12 h-12 mx-auto text-primary" />
                <h3 className="font-semibold">Awaiting 50% Deposit</h3>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Quote Approved</p>
                  <p className="text-2xl font-bold text-green-600">${project.totalCost || "0.00"}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Waiting for deposit payment of <strong>${(parseFloat(project.totalCost || "0") / 2).toFixed(2)}</strong>
                </p>
                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={() => onSendReminder("payment")}
                    disabled={isSendingReminder}
                    data-testid="button-send-payment-reminder"
                  >
                    {isSendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Payment Reminder
                  </Button>
                  <Button 
                    className="gap-2" 
                    onClick={() => onAdvancePhase("deposit_paid")}
                    disabled={isUpdating}
                    data-testid="button-mark-paid"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                    Mark Deposit Paid
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Deposit Paid - Phase Complete */}
            {status === "deposit_paid" && (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                </motion.div>
                <h3 className="font-semibold text-green-600">Phase 3 Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  TOS signed, quote approved, and 50% deposit received. Ready to proceed to Design phase.
                </p>
                <Button 
                  className="gap-2" 
                  onClick={() => onAdvancePhase("design_pending")}
                  disabled={isUpdating}
                  data-testid="button-proceed-phase4"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Proceed to Phase 4
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 4: Design
function Phase4Content({ client, project, onAdvancePhase, onUploadTemplates, isUpdating, isUploading }: any) {
  const status = project.status;
  const [templateUrls, setTemplateUrls] = useState<string[]>(
    project.designTemplateUrls ? JSON.parse(project.designTemplateUrls) : ['', '', '', '']
  );
  const { toast } = useToast();

  const handleUrlChange = (index: number, value: string) => {
    const updated = [...templateUrls];
    updated[index] = value;
    setTemplateUrls(updated);
  };

  const hasTemplates = templateUrls.some(url => url.trim() !== '');
  const selectedIndex = project.selectedTemplateIndex;

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Phase 4: Design Consultation
          </CardTitle>
          <CardDescription>
            Add template URLs for client to select from.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "design_pending" && (
            <>
              {/* Template URL Inputs */}
              <div className="space-y-4">
                <h4 className="font-medium">Design Template URLs</h4>
                <p className="text-sm text-muted-foreground">
                  Enter URLs for 4 design templates. These can be Wix template previews, screenshots, or design mockups.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Label htmlFor={`template-${i}`}>Template {i + 1}</Label>
                      <Input 
                        id={`template-${i}`}
                        placeholder="https://example.com/template-preview.jpg"
                        value={templateUrls[i] || ''}
                        onChange={(e) => handleUrlChange(i, e.target.value)}
                        data-testid={`input-template-url-${i}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {hasTemplates && (
                <div className="space-y-2">
                  <h4 className="font-medium">Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {templateUrls.map((url, i) => (
                      <div key={i} className="aspect-video bg-muted rounded-lg flex items-center justify-center border overflow-hidden">
                        {url ? (
                          <img 
                            src={url} 
                            alt={`Template ${i + 1}`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-muted-foreground text-xs p-2 text-center">Template ${i + 1}<br/>Invalid URL</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">Template {i + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  className="gap-2" 
                  onClick={() => onUploadTemplates(templateUrls)}
                  disabled={isUploading || !hasTemplates}
                  data-testid="button-save-templates"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Save Templates
                </Button>
                <Button 
                  className="gap-2" 
                  onClick={() => {
                    if (!hasTemplates) {
                      toast({ title: "Please add at least one template URL", variant: "destructive" });
                      return;
                    }
                    onUploadTemplates(templateUrls);
                    onAdvancePhase("design_sent");
                  }}
                  disabled={isUpdating || !hasTemplates}
                  data-testid="button-send-templates"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Save & Send to Client
                </Button>
              </div>
            </>
          )}

          {status === "design_sent" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-medium">Awaiting Client Selection</p>
                  <p className="text-sm text-muted-foreground">
                    Templates sent on {project.designTemplatesSentAt ? format(new Date(project.designTemplatesSentAt), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {templateUrls.map((url, i) => (
                  <div 
                    key={i} 
                    className={`aspect-video bg-muted rounded-lg flex items-center justify-center border-2 overflow-hidden ${
                      selectedIndex === i ? 'border-primary ring-2 ring-primary/20' : 'border-dashed'
                    }`}
                  >
                    {url ? (
                      <img 
                        src={url} 
                        alt={`Template ${i + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Template {i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
              {selectedIndex !== null && (
                <p className="text-sm text-center text-green-600">Client selected Template {selectedIndex + 1}</p>
              )}
              <div className="flex justify-center">
                <Button 
                  className="gap-2" 
                  onClick={() => onAdvancePhase("design_approved")}
                  disabled={isUpdating}
                  data-testid="button-mark-design-approved"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Mark Design Approved
                </Button>
              </div>
            </div>
          )}

          {status === "design_approved" && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <h3 className="font-semibold text-green-600">Design Approved!</h3>
              <p className="text-sm text-muted-foreground">
                Client selected their preferred template. Ready to begin development.
              </p>
              {project.selectedTemplateUrl && (
                <div className="max-w-xs mx-auto aspect-video rounded-lg overflow-hidden border">
                  <img src={project.selectedTemplateUrl} alt="Selected Template" className="w-full h-full object-cover" />
                </div>
              )}
              <Button 
                className="gap-2" 
                onClick={() => onAdvancePhase("in_development")}
                disabled={isUpdating}
                data-testid="button-start-development"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Start Development
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 5: Development
function Phase5Content({ client, project, onAdvancePhase, onUpdateProject, isUpdating }: any) {
  const [stagingUrl, setStagingUrl] = useState(project.stagingUrl || '');
  const [progress, setProgress] = useState(project.developmentProgress || 0);
  const [notes, setNotes] = useState(project.developmentNotes || '');
  const [platform, setPlatform] = useState(project.websitePlatform || 'wix');

  const hasChanges = stagingUrl !== (project.stagingUrl || '') || 
                     progress !== (project.developmentProgress || 0) ||
                     notes !== (project.developmentNotes || '') ||
                     platform !== (project.websitePlatform || 'wix');

  const handleSave = () => {
    onUpdateProject({
      stagingUrl,
      developmentProgress: progress,
      developmentNotes: notes,
      websitePlatform: platform,
    });
  };

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Phase 5: Website Development
          </CardTitle>
          <CardDescription>
            Actively building the website based on approved design.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Development Platform</Label>
            <div className="flex gap-2">
              {['wix', 'shopify', 'wordpress', 'custom'].map((p) => (
                <Button
                  key={p}
                  variant={platform === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatform(p)}
                  data-testid={`button-platform-${p}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Slider */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <Label>Development Progress</Label>
              <span className="font-medium">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              data-testid="slider-progress"
            />
            <Progress value={progress} className="h-3" />
          </div>

          {/* Staging URL */}
          <div className="space-y-2">
            <Label htmlFor="staging-url">Staging URL</Label>
            <Input
              id="staging-url"
              placeholder="https://staging.example.wixsite.com/preview"
              value={stagingUrl}
              onChange={(e) => setStagingUrl(e.target.value)}
              data-testid="input-staging-url"
            />
            {stagingUrl && (
              <a 
                href={stagingUrl.startsWith('http') ? stagingUrl : `https://${stagingUrl}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-primary hover:underline"
              >
                Open staging site
              </a>
            )}
          </div>

          {/* Development Notes */}
          <div className="space-y-2">
            <Label htmlFor="dev-notes">Development Notes</Label>
            <Textarea
              id="dev-notes"
              placeholder="Notes about development progress, issues, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="textarea-dev-notes"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleSave}
              disabled={isUpdating || !hasChanges}
              data-testid="button-save-progress"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Save Progress
            </Button>
            <Button 
              className="gap-2" 
              onClick={() => {
                if (hasChanges) handleSave();
                onAdvancePhase("ready_for_review");
              }}
              disabled={isUpdating}
              data-testid="button-mark-ready-review"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Mark Ready for Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 6: Ready for Review
function Phase6Content({ client, project, onAdvancePhase, onSendReminder, isUpdating, isSendingReminder }: any) {
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false, false]);
  const qaItems = [
    "All pages load correctly",
    "Mobile responsive",
    "Forms working",
    "Images optimized",
    "Links functional",
  ];
  const allChecked = checklist.every(Boolean);

  const toggleCheck = (index: number) => {
    const updated = [...checklist];
    updated[index] = !updated[index];
    setChecklist(updated);
  };

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Phase 6: Ready for Review
          </CardTitle>
          <CardDescription>
            Development complete. Perform QA and send to client for preview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Staging URL */}
          {project.stagingUrl && (
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
              <Globe className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Staging URL</p>
                <p className="text-sm text-muted-foreground">{project.stagingUrl}</p>
              </div>
              <a href={project.stagingUrl.startsWith('http') ? project.stagingUrl : `https://${project.stagingUrl}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </Button>
              </a>
            </div>
          )}

          {/* QA Checklist */}
          <div className="space-y-3">
            <h4 className="font-medium">Internal QA Checklist</h4>
            {qaItems.map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                onClick={() => toggleCheck(i)}
                data-testid={`qa-item-${i}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checklist[i] ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}>
                  {checklist[i] && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${checklist[i] ? 'text-muted-foreground line-through' : ''}`}>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              className="flex-1 gap-2" 
              onClick={() => onAdvancePhase("client_review")}
              disabled={isUpdating || !allChecked}
              data-testid="button-send-to-client"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send to Client for Review
            </Button>
          </div>
          {!allChecked && (
            <p className="text-xs text-muted-foreground text-center">Complete all QA checks before sending to client</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 7: Review & Delivery
function Phase7Content({ client, project, payments, onAdvancePhase, onCreatePayment, isUpdating, isCreatingPayment }: any) {
  const status = project.status;
  const [invoiceAmount, setInvoiceAmount] = useState("");
  
  // Check if there's a pending final payment
  const hasPendingFinalPayment = payments.some((p: any) => 
    p.paymentType === "final" && p.status === "pending" && p.projectId === project.id
  );
  
  // Calculate suggested amount (50% of total cost or remaining balance)
  const totalCost = parseFloat(project.totalCost || "0");
  const paidAmount = payments
    .filter((p: any) => p.status === "paid" && p.projectId === project.id)
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);
  const suggestedAmount = Math.max(totalCost - paidAmount, totalCost / 2);
  
  const handleSendInvoice = () => {
    const amount = invoiceAmount || suggestedAmount.toFixed(2);
    if (!amount || parseFloat(amount) <= 0) return;
    
    onCreatePayment({
      clientId: client.id,
      projectId: project.id,
      amount: amount,
      description: "Final Payment - Website Delivery",
      paymentType: "final",
    });
  };

  const { data: feedbackMessages = [], isLoading: feedbackLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/projects', project.id, 'messages', 'development_feedback'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/projects/${project.id}/messages?category=development_feedback`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getWarrantyDays = () => {
    if (!project.warrantyEndDate) return 25;
    const end = new Date(project.warrantyEndDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Phase 7: Client Review & Delivery
          </CardTitle>
          <CardDescription>
            Final review, revisions, payment, hosting setup, and project handover.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status indicator */}
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="font-medium">Current Status: {getStatusLabel(status)}</p>
          </div>

          {/* Client Feedback */}
          {(status === "client_review" || status === "revisions_pending" || status === "revisions_complete") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Client Feedback
                </Label>
                {feedbackMessages.length > 0 && (
                  <Badge variant="secondary">{feedbackMessages.length} message{feedbackMessages.length !== 1 ? 's' : ''}</Badge>
                )}
              </div>
              
              {feedbackLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading feedback...
                </div>
              ) : feedbackMessages.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
                  No client feedback yet. Clients can share their thoughts during review.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {feedbackMessages.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg"
                      data-testid={`feedback-message-${msg.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-medium">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.messageText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === "client_review" && (
            <div className="text-center space-y-4 py-4">
              <Clock className="w-12 h-12 mx-auto text-amber-500" />
              <h3 className="font-semibold">Client Reviewing Website</h3>
              <p className="text-sm text-muted-foreground">
                Waiting for client feedback and revision requests.
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => onAdvancePhase("revisions_pending")}
                  disabled={isUpdating}
                  data-testid="button-revisions-requested"
                >
                  Revisions Requested
                </Button>
                <Button 
                  className="gap-2" 
                  onClick={() => onAdvancePhase("awaiting_final_payment")}
                  disabled={isUpdating}
                  data-testid="button-no-revisions"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  No Revisions - Proceed to Payment
                </Button>
              </div>
            </div>
          )}

          {status === "revisions_pending" && (
            <div className="text-center space-y-4 py-4">
              <RefreshCw className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold">Revisions In Progress</h3>
              <p className="text-sm text-muted-foreground">
                Working on client-requested revisions.
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  className="gap-2" 
                  onClick={() => onAdvancePhase("revisions_complete")}
                  disabled={isUpdating}
                  data-testid="button-revisions-complete"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Mark Revisions Complete
                </Button>
              </div>
            </div>
          )}

          {status === "revisions_complete" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <h3 className="font-semibold">Revisions Complete</h3>
              <p className="text-sm text-muted-foreground">
                All revisions have been completed. Ready for final payment.
              </p>
              <Button 
                className="gap-2" 
                onClick={() => onAdvancePhase("awaiting_final_payment")}
                disabled={isUpdating}
                data-testid="button-request-final-payment"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Request Final Payment
              </Button>
            </div>
          )}

          {status === "awaiting_final_payment" && (
            <div className="text-center space-y-4 py-4">
              <DollarSign className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold">Awaiting Final Payment</h3>
              
              {!hasPendingFinalPayment ? (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No invoice has been sent yet. Create one below.
                    </p>
                    <div className="space-y-3">
                      <div className="text-left">
                        <Label className="text-xs">Invoice Amount ($)</Label>
                        <Input
                          type="number"
                          placeholder={suggestedAmount > 0 ? suggestedAmount.toFixed(2) : "Enter amount"}
                          value={invoiceAmount}
                          onChange={(e) => setInvoiceAmount(e.target.value)}
                          className="mt-1"
                          data-testid="input-invoice-amount"
                        />
                        {suggestedAmount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Suggested: ${suggestedAmount.toFixed(2)} based on project cost
                          </p>
                        )}
                      </div>
                      <Button 
                        className="w-full gap-2" 
                        onClick={handleSendInvoice}
                        disabled={isCreatingPayment || (!invoiceAmount && suggestedAmount <= 0)}
                        data-testid="button-send-invoice"
                      >
                        {isCreatingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Final Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Invoice sent! Waiting for client to pay through their portal.
                    </p>
                  </div>
                  <Button 
                    className="gap-2" 
                    onClick={() => onAdvancePhase("payment_complete")}
                    disabled={isUpdating}
                    data-testid="button-mark-payment-complete"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Mark Payment Complete
                  </Button>
                </div>
              )}
            </div>
          )}

          {status === "payment_complete" && (
            <div className="text-center space-y-4 py-4">
              <Globe className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold">Payment Received - Setup Hosting</h3>
              <p className="text-sm text-muted-foreground">
                Full payment received. Configure hosting and domain.
              </p>
              <Button 
                className="gap-2" 
                onClick={() => onAdvancePhase("hosting_setup_pending")}
                disabled={isUpdating}
                data-testid="button-setup-hosting"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Begin Hosting Setup
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {status === "hosting_setup_pending" && (
            <div className="text-center space-y-4 py-4">
              <Globe className="w-12 h-12 mx-auto text-amber-500" />
              <h3 className="font-semibold">Configuring Hosting</h3>
              <p className="text-sm text-muted-foreground">
                Awaiting client hosting credentials or domain configuration.
              </p>
              <Button 
                className="gap-2" 
                onClick={() => onAdvancePhase("hosting_configured")}
                disabled={isUpdating}
                data-testid="button-hosting-configured"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Mark Hosting Configured
              </Button>
            </div>
          )}

          {status === "hosting_configured" && (
            <div className="text-center space-y-4 py-4">
              <Rocket className="w-12 h-12 mx-auto text-green-500" />
              <h3 className="font-semibold">Ready for Final Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Hosting is configured. Complete the project handover.
              </p>
              <Button 
                className="gap-2" 
                onClick={() => onAdvancePhase("completed")}
                disabled={isUpdating}
                data-testid="button-complete-project"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Complete Project
              </Button>
            </div>
          )}

          {status === "completed" && (
            <div className="text-center space-y-4 py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              </motion.div>
              <h3 className="font-semibold text-xl text-green-600">Project Complete!</h3>
              <p className="text-muted-foreground">
                Delivered on {project.completedAt ? format(new Date(project.completedAt), "MMM d, yyyy") : "N/A"}
              </p>
              <Badge className="bg-green-500/10 text-green-600">
                Warranty: {getWarrantyDays()} days remaining
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Special States (On Hold / Cancelled)
function SpecialStateContent({ client, project }: any) {
  const isOnHold = project.status === "on_hold";
  const isCancelled = project.status === "cancelled";

  return (
    <motion.div variants={fadeInUp}>
      <Card className={isOnHold ? "border-amber-500/50" : "border-red-500/50"}>
        <CardContent className="flex flex-col items-center py-8">
          {isOnHold ? (
            <>
              <Clock className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="font-semibold text-lg">Project On Hold</h3>
              <p className="text-muted-foreground text-center mt-2">
                {project.onHoldReason || "No reason provided"}
              </p>
              <Button className="mt-4 gap-2">
                Resume Project
              </Button>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="font-semibold text-lg">Project Cancelled</h3>
              <p className="text-muted-foreground text-center mt-2">
                This project has been cancelled.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
