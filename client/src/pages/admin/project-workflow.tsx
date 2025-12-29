import { useState } from "react";
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
  KeyRound
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
    name: "Quote & Agreement", 
    icon: FileText,
    statuses: ["quote_draft", "quote_sent", "quote_approved", "tos_pending", "tos_signed", "deposit_pending", "deposit_paid"],
    description: "Quote approval, TOS signature, and 50% deposit"
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

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/auth/verify-pin", { pin });
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
          <Link href={`/admin/clients/${clientId}`}>
            <Button variant="outline" data-testid="button-client-details">
              View Full Details
            </Button>
          </Link>
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
                <Phase2Content client={client} project={project} />
              )}
              {currentPhase === 3 && (
                <Phase3Content client={client} project={project} />
              )}
              {currentPhase === 4 && (
                <Phase4Content client={client} project={project} />
              )}
              {currentPhase === 5 && (
                <Phase5Content client={client} project={project} />
              )}
              {currentPhase === 6 && (
                <Phase6Content client={client} project={project} />
              )}
              {currentPhase === 7 && (
                <Phase7Content client={client} project={project} />
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
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Resend Email
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Questionnaire Link
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
function Phase2Content({ client, project }: any) {
  const isPending = project.status === "questionnaire_pending";
  const isComplete = project.status === "questionnaire_complete";

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
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
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Send className="w-4 h-4" />
                  Send Reminder
                </Button>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Questionnaire
                </Button>
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
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Full Responses
                </Button>
                <Link href={`/admin/clients/${client.id}/quote`}>
                  <Button className="gap-2">
                    Create Quote
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 3: Quote & Agreement
function Phase3Content({ client, project }: any) {
  const status = project.status;
  const statusSteps = [
    { key: "quote_draft", label: "Draft Quote", done: false },
    { key: "quote_sent", label: "Quote Sent", done: false },
    { key: "quote_approved", label: "Quote Approved", done: false },
    { key: "tos_signed", label: "TOS Signed", done: false },
    { key: "deposit_paid", label: "Deposit Received", done: false },
  ];

  // Determine which steps are done
  const statusOrder = ["quote_draft", "quote_sent", "quote_approved", "tos_pending", "tos_signed", "deposit_pending", "deposit_paid"];
  const currentIndex = statusOrder.indexOf(status);
  
  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Phase 3: Quote & Agreement
          </CardTitle>
          <CardDescription>
            Create and send quote, obtain TOS signature, and collect 50% deposit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mini Progress */}
          <div className="flex items-center gap-2">
            {["Quote", "Approved", "TOS Signed", "Deposit Paid"].map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${currentIndex >= i * 2 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}
                `}>
                  {currentIndex >= i * 2 ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs hidden sm:block">{step}</span>
                {i < 3 && <div className="flex-1 h-0.5 bg-muted" />}
              </div>
            ))}
          </div>

          {/* Content based on status */}
          <div className="border rounded-lg p-6">
            {status === "quote_draft" && (
              <div className="text-center space-y-4">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="font-semibold">Create Project Quote</h3>
                <p className="text-sm text-muted-foreground">
                  Review the questionnaire responses and create a detailed quote with pricing tiers.
                </p>
                <Link href={`/admin/clients/${client.id}/quote/create`}>
                  <Button className="gap-2">
                    <FileText className="w-4 h-4" />
                    Create Quote
                  </Button>
                </Link>
              </div>
            )}
            
            {status === "quote_sent" && (
              <div className="text-center space-y-4">
                <Clock className="w-12 h-12 mx-auto text-amber-500" />
                <h3 className="font-semibold">Awaiting Client Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Quote sent to client. Waiting for their response.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Quote
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Send className="w-4 h-4" />
                    Send Reminder
                  </Button>
                </div>
              </div>
            )}

            {(status === "quote_approved" || status === "tos_pending") && (
              <div className="text-center space-y-4">
                <FileText className="w-12 h-12 mx-auto text-primary" />
                <h3 className="font-semibold">Awaiting TOS Signature</h3>
                <p className="text-sm text-muted-foreground">
                  Quote approved! Waiting for client to sign Terms of Service.
                </p>
                <Button variant="outline" className="gap-2">
                  <Send className="w-4 h-4" />
                  Resend TOS
                </Button>
              </div>
            )}

            {(status === "tos_signed" || status === "deposit_pending") && (
              <div className="text-center space-y-4">
                <DollarSign className="w-12 h-12 mx-auto text-primary" />
                <h3 className="font-semibold">Awaiting 50% Deposit</h3>
                <p className="text-sm text-muted-foreground">
                  TOS signed! Waiting for deposit payment of ${(parseFloat(project.totalCost) / 2).toFixed(2)}.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" className="gap-2">
                    <Send className="w-4 h-4" />
                    Send Payment Reminder
                  </Button>
                  <Button className="gap-2">
                    <DollarSign className="w-4 h-4" />
                    Mark as Paid
                  </Button>
                </div>
              </div>
            )}

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
                  Quote approved, TOS signed, and deposit received. Ready to proceed to Design phase.
                </p>
                <Button className="gap-2">
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
function Phase4Content({ client, project }: any) {
  const status = project.status;

  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Phase 4: Design Consultation
          </CardTitle>
          <CardDescription>
            Upload design templates for client selection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "design_pending" && (
            <div className="text-center space-y-4 py-6">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="font-semibold">Upload Design Templates</h3>
              <p className="text-sm text-muted-foreground">
                Find 4 suitable templates and upload screenshots for client review.
              </p>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Templates
              </Button>
            </div>
          )}

          {status === "design_sent" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-medium">Awaiting Client Selection</p>
                  <p className="text-sm text-muted-foreground">Templates sent to client for review</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Template {i}</span>
                  </div>
                ))}
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
              <Button className="gap-2">
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
function Phase5Content({ client, project }: any) {
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
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Development Progress</span>
              <span className="font-medium">{project.developmentProgress || 0}%</span>
            </div>
            <Progress value={project.developmentProgress || 0} className="h-3" />
          </div>

          {/* Staging URL */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Staging URL</p>
              <p className="text-sm text-muted-foreground">
                {project.stagingUrl || "Not configured yet"}
              </p>
            </div>
            {project.stagingUrl && (
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                View Site
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="gap-2">
              Update Progress
            </Button>
            <Button className="gap-2">
              <Eye className="w-4 h-4" />
              Mark Ready for Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 6: Ready for Review
function Phase6Content({ client, project }: any) {
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
          {/* QA Checklist */}
          <div className="space-y-3">
            <h4 className="font-medium">Internal QA Checklist</h4>
            {[
              "All pages load correctly",
              "Mobile responsive",
              "Forms working",
              "Images optimized",
              "Links functional",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded border flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>

          <Button className="w-full gap-2">
            <Send className="w-4 h-4" />
            Send to Client for Review
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Phase 7: Review & Delivery
function Phase7Content({ client, project }: any) {
  const status = project.status;

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
        <CardContent>
          {/* Status indicator */}
          <div className="p-4 rounded-lg bg-muted/50 mb-6">
            <p className="font-medium">Current Status: {getStatusLabel(status)}</p>
          </div>

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
                Warranty: 25 days remaining
              </Badge>
            </div>
          )}

          {status !== "completed" && (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Phase 7 workflow tools will appear here based on current status.
              </p>
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
