import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Download,
  Lock,
  Share2,
  XCircle,
  Sparkles,
  LayoutGrid,
  Receipt,
  FolderOpen,
  Activity,
  KeyRound,
  AlertTriangle,
  Loader2
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PortalLayout } from "@/components/portal/portal-layout";
import { PDFSignatureEditor, SignatureField } from "@/components/pdf-signature-editor";
import { FileUploader } from "@/components/FileUploader";
import { CloseAccountForm } from "@/components/admin/close-account-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  created: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  questionnaire_pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  questionnaire_complete: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  quote_draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  quote_sent: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  quote_approved: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  tos_pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  tos_signed: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  deposit_pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  deposit_paid: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  design_pending: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  design_sent: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  design_approved: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  in_development: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ready_for_review: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  client_review: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  revisions_pending: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  revisions_complete: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  awaiting_final_payment: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  payment_complete: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  hosting_setup_pending: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  hosting_configured: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_hold: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const phaseLabels: Record<string, { label: string; phase: number; description: string }> = {
  draft: { label: "Draft", phase: 1, description: "Admin created client, not yet sent welcome email" },
  created: { label: "Client Setup", phase: 1, description: "Client account created and ready for onboarding" },
  questionnaire_pending: { label: "Questionnaire", phase: 2, description: "Waiting for client to complete questionnaire" },
  questionnaire_complete: { label: "Questionnaire Complete", phase: 2, description: "Client has completed the questionnaire" },
  quote_draft: { label: "Quote Draft", phase: 3, description: "Admin is drafting quote" },
  quote_sent: { label: "Quote Sent", phase: 3, description: "Quote sent to client" },
  quote_approved: { label: "Quote Approved", phase: 3, description: "Client approved quote" },
  tos_pending: { label: "Terms of Service", phase: 3, description: "Waiting for client to sign Terms of Service" },
  tos_signed: { label: "TOS Signed", phase: 3, description: "Client has signed Terms of Service" },
  deposit_pending: { label: "Deposit Pending", phase: 3, description: "Awaiting 50% deposit payment" },
  deposit_paid: { label: "Deposit Paid", phase: 3, description: "50% deposit received" },
  design_pending: { label: "Design Pending", phase: 4, description: "Awaiting design template selection" },
  design_sent: { label: "Design Sent", phase: 4, description: "Admin sent design options to client" },
  design_approved: { label: "Design Approved", phase: 4, description: "Client approved design" },
  in_development: { label: "Development", phase: 5, description: "Website is being built" },
  ready_for_review: { label: "Ready for Review", phase: 6, description: "Development complete, ready for client preview" },
  client_review: { label: "Client Review", phase: 7, description: "Client reviewing the site" },
  revisions_pending: { label: "Revisions Pending", phase: 7, description: "Client requested revisions" },
  revisions_complete: { label: "Revisions Complete", phase: 7, description: "All revisions done" },
  awaiting_final_payment: { label: "Awaiting Final Payment", phase: 7, description: "Awaiting 50% final payment" },
  payment_complete: { label: "Payment Complete", phase: 7, description: "Final payment received" },
  hosting_setup_pending: { label: "Hosting Setup", phase: 7, description: "Awaiting client hosting credentials" },
  hosting_configured: { label: "Hosting Configured", phase: 7, description: "Hosting configured, ready for final delivery" },
  completed: { label: "Project Complete", phase: 7, description: "Project has been successfully completed" },
  on_hold: { label: "On Hold", phase: 0, description: "Project is temporarily paused" },
  cancelled: { label: "Cancelled", phase: 0, description: "Project has been cancelled" },
};

// All valid project statuses for the override dropdown
const ALL_PROJECT_STATUSES = [
  { value: "draft", label: "Phase 1: Draft", phase: 1 },
  { value: "created", label: "Phase 1: Created", phase: 1 },
  { value: "questionnaire_pending", label: "Phase 2: Questionnaire Pending", phase: 2 },
  { value: "questionnaire_complete", label: "Phase 2: Questionnaire Complete", phase: 2 },
  { value: "quote_draft", label: "Phase 3: Quote Draft", phase: 3 },
  { value: "quote_sent", label: "Phase 3: Quote Sent", phase: 3 },
  { value: "quote_approved", label: "Phase 3: Quote Approved", phase: 3 },
  { value: "tos_pending", label: "Phase 3: TOS Pending", phase: 3 },
  { value: "tos_signed", label: "Phase 3: TOS Signed", phase: 3 },
  { value: "deposit_pending", label: "Phase 3: Deposit Pending", phase: 3 },
  { value: "deposit_paid", label: "Phase 3: Deposit Paid", phase: 3 },
  { value: "design_pending", label: "Phase 4: Design Pending", phase: 4 },
  { value: "design_sent", label: "Phase 4: Design Sent", phase: 4 },
  { value: "design_approved", label: "Phase 4: Design Approved", phase: 4 },
  { value: "in_development", label: "Phase 5: In Development", phase: 5 },
  { value: "ready_for_review", label: "Phase 6: Ready for Review", phase: 6 },
  { value: "client_review", label: "Phase 7: Client Review", phase: 7 },
  { value: "revisions_pending", label: "Phase 7: Revisions Pending", phase: 7 },
  { value: "revisions_complete", label: "Phase 7: Revisions Complete", phase: 7 },
  { value: "awaiting_final_payment", label: "Phase 7: Awaiting Final Payment", phase: 7 },
  { value: "payment_complete", label: "Phase 7: Payment Complete", phase: 7 },
  { value: "hosting_setup_pending", label: "Phase 7A: Hosting Setup Pending", phase: 7 },
  { value: "hosting_configured", label: "Phase 7A: Hosting Configured", phase: 7 },
  { value: "completed", label: "Completed", phase: 7 },
  { value: "on_hold", label: "On Hold", phase: 0 },
  { value: "cancelled", label: "Cancelled", phase: 0 },
];

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

function EmbeddedPhaseTools({ client, project, status }: {
  client: any;
  project: any;
  status: string;
}) {
  const { toast } = useToast();
  const phase = phaseLabels[status]?.phase || 0;
  
  const clientId = String(client.id);
  
  const sendWelcomeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/projects/${project?.id}/send-welcome`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Welcome email sent", description: "Client received login credentials." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send email", description: error.message, variant: "destructive" });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", `/api/admin/projects/${project?.id}/send-reminder`, { type });
      return res.json();
    },
    onSuccess: (_, type) => {
      toast({ title: "Reminder sent", description: `${type} reminder email sent.` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reminder", description: error.message, variant: "destructive" });
    },
  });

  const advanceStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${project?.id}/status`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  if (!project) return <div className="text-center text-muted-foreground py-4">No project found</div>;

  // Phase 1: Onboarding
  if (phase === 1) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-4 h-4" />
          Phase 1: Client Onboarding
        </h3>
        {status === "draft" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Client account is ready. Send welcome email with login credentials.
            </p>
            <Button 
              className="gap-2" 
              onClick={() => sendWelcomeMutation.mutate()}
              disabled={sendWelcomeMutation.isPending}
              data-testid="button-send-welcome"
            >
              {sendWelcomeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Welcome Email
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm">Welcome email sent - waiting for questionnaire</span>
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => sendReminderMutation.mutate("questionnaire")}
              disabled={sendReminderMutation.isPending}
            >
              {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Questionnaire Reminder
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Phase 2: Questionnaire
  if (phase === 2) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Phase 2: Client Questionnaire
        </h3>
        {status === "questionnaire_pending" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Waiting for client to complete the project questionnaire.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="gap-2"
                onClick={() => sendReminderMutation.mutate("questionnaire")}
                disabled={sendReminderMutation.isPending}
              >
                {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Reminder
              </Button>
              <Button
                className="gap-2"
                onClick={() => advanceStatusMutation.mutate("questionnaire_complete")}
                disabled={advanceStatusMutation.isPending}
              >
                Mark Complete
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm">Questionnaire completed</span>
            </div>
            <Button
              className="gap-2"
              onClick={() => advanceStatusMutation.mutate("quote_draft")}
              disabled={advanceStatusMutation.isPending}
            >
              Create Quote
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Phase 3: Quote & Agreement
  if (phase === 3) {
    const phase3Steps = ["quote_draft", "quote_sent", "quote_approved", "tos_pending", "tos_signed", "deposit_pending", "deposit_paid"];
    const currentStep = phase3Steps.indexOf(status);
    
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Phase 3: Quote & Agreement
        </h3>
        <div className="flex gap-1">
          {["Quote", "Approved", "TOS", "Deposit"].map((step, i) => (
            <div key={step} className={`flex-1 h-2 rounded ${currentStep >= i * 2 ? "bg-green-500" : "bg-muted"}`} />
          ))}
        </div>
        
        {status === "quote_draft" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Create quote with pricing. Go to Quotes tab to add quote details.</p>
            <Button className="gap-2" onClick={() => advanceStatusMutation.mutate("quote_sent")} disabled={advanceStatusMutation.isPending}>
              Mark Quote Sent
            </Button>
          </div>
        )}
        {status === "quote_sent" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Waiting for client to approve quote.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => sendReminderMutation.mutate("quote")} disabled={sendReminderMutation.isPending}>Send Reminder</Button>
              <Button onClick={() => advanceStatusMutation.mutate("quote_approved")} disabled={advanceStatusMutation.isPending}>Mark Approved</Button>
            </div>
          </div>
        )}
        {(status === "quote_approved" || status === "tos_pending") && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Waiting for TOS signature. Go to Documents tab to send TOS.</p>
            <Button variant="outline" onClick={() => sendReminderMutation.mutate("tos")} disabled={sendReminderMutation.isPending}>Resend TOS</Button>
          </div>
        )}
        {(status === "tos_signed" || status === "deposit_pending") && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">TOS signed! Waiting for 50% deposit. Go to Payments tab to send invoice.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => sendReminderMutation.mutate("payment")} disabled={sendReminderMutation.isPending}>Send Reminder</Button>
              <Button onClick={() => advanceStatusMutation.mutate("deposit_paid")} disabled={advanceStatusMutation.isPending}>Mark Paid</Button>
            </div>
          </div>
        )}
        {status === "deposit_paid" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600"><Check className="w-4 h-4" /><span>Phase 3 Complete!</span></div>
            <Button onClick={() => advanceStatusMutation.mutate("design_pending")} disabled={advanceStatusMutation.isPending}>Proceed to Design</Button>
          </div>
        )}
      </div>
    );
  }

  // Phase 4: Design
  if (phase === 4) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Phase 4: Design Consultation
        </h3>
        {status === "design_pending" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Add template URLs for client selection. Update project with template URLs.</p>
            <Button onClick={() => advanceStatusMutation.mutate("design_sent")} disabled={advanceStatusMutation.isPending}>Mark Templates Sent</Button>
          </div>
        )}
        {status === "design_sent" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Waiting for client to select a design template.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => sendReminderMutation.mutate("design")} disabled={sendReminderMutation.isPending}>Send Reminder</Button>
              <Button onClick={() => advanceStatusMutation.mutate("design_approved")} disabled={advanceStatusMutation.isPending}>Mark Selected</Button>
            </div>
          </div>
        )}
        {status === "design_approved" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600"><Check className="w-4 h-4" /><span>Design approved!</span></div>
            <Button onClick={() => advanceStatusMutation.mutate("in_development")} disabled={advanceStatusMutation.isPending}>Start Development</Button>
          </div>
        )}
      </div>
    );
  }

  // Phase 5: Development
  if (phase === 5) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Phase 5: Website Development
        </h3>
        <p className="text-sm text-muted-foreground">Website is being built. Update staging URL in project settings.</p>
        <div className="p-3 bg-muted/50 rounded-lg">
          <span className="text-xs text-muted-foreground">Staging URL:</span>
          <p className="font-medium">{project?.stagingUrl || "Not set"}</p>
        </div>
        <Button onClick={() => advanceStatusMutation.mutate("ready_for_review")} disabled={advanceStatusMutation.isPending}>
          Mark Ready for Review
        </Button>
      </div>
    );
  }

  // Phase 6: Review
  if (phase === 6) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Phase 6: Ready for Review
        </h3>
        <p className="text-sm text-muted-foreground">Complete QA checks and send staging link to client.</p>
        <Button onClick={() => advanceStatusMutation.mutate("client_review")} disabled={advanceStatusMutation.isPending}>
          Send to Client for Review
        </Button>
      </div>
    );
  }

  // Phase 7: Review & Delivery
  if (phase === 7) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Phase 7: Review & Delivery
        </h3>
        
        {status === "client_review" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Client is reviewing the website.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => advanceStatusMutation.mutate("revisions_pending")} disabled={advanceStatusMutation.isPending}>Revisions Requested</Button>
              <Button onClick={() => advanceStatusMutation.mutate("awaiting_final_payment")} disabled={advanceStatusMutation.isPending}>No Revisions - Proceed</Button>
            </div>
          </div>
        )}
        {status === "revisions_pending" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Working on revisions.</p>
            <Button onClick={() => advanceStatusMutation.mutate("revisions_complete")} disabled={advanceStatusMutation.isPending}>Mark Revisions Complete</Button>
          </div>
        )}
        {status === "revisions_complete" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600"><Check className="w-4 h-4" /><span>Revisions complete!</span></div>
            <Button onClick={() => advanceStatusMutation.mutate("awaiting_final_payment")} disabled={advanceStatusMutation.isPending}>Request Final Payment</Button>
          </div>
        )}
        {status === "awaiting_final_payment" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Waiting for final 50% payment. Go to Payments tab to send invoice.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => sendReminderMutation.mutate("payment")} disabled={sendReminderMutation.isPending}>Send Reminder</Button>
              <Button onClick={() => advanceStatusMutation.mutate("payment_complete")} disabled={advanceStatusMutation.isPending}>Mark Paid</Button>
            </div>
          </div>
        )}
        {status === "payment_complete" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600"><Check className="w-4 h-4" /><span>Payment received!</span></div>
            <Button onClick={() => advanceStatusMutation.mutate("hosting_setup_pending")} disabled={advanceStatusMutation.isPending}>Begin Hosting Setup</Button>
          </div>
        )}
        {status === "hosting_setup_pending" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Waiting for client to submit Hostinger credentials via their portal.</p>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">Credentials received: </span>
              <span className={project?.hostingCredentialsReceived ? "text-green-600" : "text-amber-600"}>
                {project?.hostingCredentialsReceived ? "Yes" : "Not yet"}
              </span>
            </div>
            <Button onClick={() => advanceStatusMutation.mutate("hosting_configured")} disabled={advanceStatusMutation.isPending || !project?.hostingCredentialsReceived}>
              Mark Hosting Configured
            </Button>
          </div>
        )}
        {status === "hosting_configured" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600"><Check className="w-4 h-4" /><span>Hosting configured!</span></div>
            <Button onClick={() => advanceStatusMutation.mutate("completed")} disabled={advanceStatusMutation.isPending}>Complete Project</Button>
          </div>
        )}
        {status === "completed" && (
          <div className="text-center py-4">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="font-semibold text-green-600">Project Complete!</p>
            <p className="text-sm text-muted-foreground mt-1">25-day warranty is now active.</p>
          </div>
        )}
      </div>
    );
  }

  // Special states
  if (phase === 0) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
        <p className="font-medium">{status === "on_hold" ? "Project On Hold" : "Project Cancelled"}</p>
        <p className="text-sm text-muted-foreground mt-1">{project?.onHoldReason || ""}</p>
      </div>
    );
  }

  return null;
}

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
  
  // PIN verification state for status override
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>("");

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

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/payments/${paymentId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Payment deleted", description: "The payment has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete payment", description: error.message, variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/documents/${documentId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId] });
      toast({ title: "Document deleted", description: "The document has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete document", description: error.message, variant: "destructive" });
    },
  });

  // Quote state and mutations
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isCloseAccountDialogOpen, setIsCloseAccountDialogOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({
    title: "",
    description: "",
    lineItems: [{ name: "", description: "", quantity: 1, unitPrice: 0 }] as Array<{name: string; description: string; quantity: number; unitPrice: number}>,
    discountAmount: 0,
    discountDescription: "",
    taxRate: 0,
    validUntil: "",
    notes: "",
    termsAndConditions: "",
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/clients", clientId, "quotes"],
    enabled: !!clientId,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/clients/${clientId}/quotes`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId, "quotes"] });
      setIsQuoteDialogOpen(false);
      setNewQuote({
        title: "",
        description: "",
        lineItems: [{ name: "", description: "", quantity: 1, unitPrice: 0 }],
        discountAmount: 0,
        discountDescription: "",
        taxRate: 0,
        validUntil: "",
        notes: "",
        termsAndConditions: "",
      });
      toast({ title: "Quote created", description: "New quote has been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create quote", description: error.message, variant: "destructive" });
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await apiRequest("POST", `/api/admin/quotes/${quoteId}/send`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId, "quotes"] });
      toast({ title: "Quote sent", description: "Quote has been sent to the client." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send quote", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/quotes/${quoteId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", clientId, "quotes"] });
      toast({ title: "Quote deleted", description: "Quote has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete quote", description: error.message, variant: "destructive" });
    },
  });

  const addLineItem = () => {
    setNewQuote(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { name: "", description: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeLineItem = (index: number) => {
    setNewQuote(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    setNewQuote(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateQuoteTotals = () => {
    const subtotal = newQuote.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountedSubtotal = subtotal - newQuote.discountAmount;
    const taxAmount = discountedSubtotal * (newQuote.taxRate / 100);
    const total = discountedSubtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const { subtotal, taxAmount, total } = calculateQuoteTotals();
    createQuoteMutation.mutate({
      title: newQuote.title,
      description: newQuote.description,
      lineItems: newQuote.lineItems,
      subtotal: subtotal.toFixed(2),
      discountAmount: newQuote.discountAmount.toFixed(2),
      discountDescription: newQuote.discountDescription,
      taxRate: newQuote.taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: total.toFixed(2),
      validUntil: newQuote.validUntil || null,
      notes: newQuote.notes,
      termsAndConditions: newQuote.termsAndConditions,
    });
  };

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
        status: project.status || "questionnaire_pending",
        totalCost: project.totalCost || "0.00",
        paymentStructure: project.paymentStructure || "50_50",
        domain: project.domain || "",
        hosting: project.hosting || "",
        specialRequirements: project.specialRequirements || "",
      });
      setOriginalStatus(project.status || "questionnaire_pending");
    }
  }, [client]);

  // Handle status change - requires PIN verification
  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== originalStatus) {
      setPendingStatus(newStatus);
      setShowPinModal(true);
      setPinValue("");
      setPinError("");
    } else {
      setProjectSettings({ ...projectSettings, status: newStatus });
    }
  };

  // Verify PIN and apply status change
  const handleVerifyPin = async () => {
    setIsVerifyingPin(true);
    setPinError("");
    
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/pin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin: pinValue }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setPinError(data.error || "Invalid PIN");
        setIsVerifyingPin(false);
        return;
      }
      
      // PIN verified - apply the status change
      if (pendingStatus) {
        setProjectSettings({ ...projectSettings, status: pendingStatus });
        setOriginalStatus(pendingStatus);
        toast({ title: "Status updated", description: `Project status changed to ${phaseLabels[pendingStatus]?.label || pendingStatus}` });
      }
      
      setShowPinModal(false);
      setPinValue("");
      setPendingStatus(null);
    } catch (error) {
      setPinError("Failed to verify PIN");
    } finally {
      setIsVerifyingPin(false);
    }
  };

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

  const canEdit = client.editable !== false;
  const isOwner = client.isOwner === true;
  const ownerName = client.owner ? `${client.owner.firstName} ${client.owner.lastName}` : "Unknown";

  return (
    <PortalLayout requiredRole="admin">
      <motion.div 
        className="p-6 space-y-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Read-only banner for cross-admin viewing */}
        <AnimatePresence>
          {!canEdit && (
            <motion.div 
              className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-600 dark:text-amber-400">View-Only Mode</p>
                <p className="text-sm text-muted-foreground">
                  This client is managed by {ownerName}. You can view details but cannot make changes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href="/admin/clients">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-client-name">
                  {client.businessLegalName}
                </h1>
                {(client.status === "completed" || client.status === "cancelled") && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Account Closed
                    </Badge>
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">{client.industry || "No industry specified"}</p>
                {!isOwner && (
                  <Badge variant="outline" className="text-xs">
                    <Share2 className="w-3 h-3 mr-1" />
                    Shared by {ownerName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
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
          )}
        </motion.div>

        <motion.div 
          className="grid gap-6 md:grid-cols-3"
          variants={fadeInUp}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="md:col-span-1 h-full border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.user && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Primary Contact</p>
                    <p className="font-medium mt-1">{client.user.firstName} {client.user.lastName}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{client.businessEmail || client.user?.email}</span>
                  </div>
                  {client.businessPhone && (
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{client.businessPhone}</span>
                    </div>
                  )}
                  {client.existingWebsite && (
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={client.existingWebsite} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary">
                        {client.existingWebsite}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Client since {client.createdAt ? format(new Date(client.createdAt), "MMM d, yyyy") : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="h-full border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Projects", value: client.projects?.length || 0, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                    { label: "Payments", value: client.payments?.length || 0, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
                    { label: "Documents", value: client.documents?.length || 0, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                    { label: "Messages", value: client.messages?.length || 0, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className={`text-center p-4 rounded-xl ${stat.color.split(' ')[0]} border border-transparent hover:border-border/50 hover-elevate transition-all`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    >
                      <p className={`text-3xl font-bold ${stat.color.split(' ').slice(1).join(' ')}`}>{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="flex-wrap gap-1 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-project-settings">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Project Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-projects">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="quotes" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-quotes">
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">Quotes</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-payments">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-documents">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="uploads" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-uploads">
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Uploads</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-activity">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="portal-preview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" data-testid="tab-portal-preview">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Portal Preview</span>
              </TabsTrigger>
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
                    <CardContent className="space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((phase) => {
                          const currentPhase = phaseLabels[projectSettings.status]?.phase || 0;
                          const isComplete = currentPhase > phase;
                          const isCurrent = currentPhase === phase;
                          const phaseNames = ["Onboarding", "Questionnaire", "Agreement", "Design", "Development", "Review", "Delivery"];
                          
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
                      
                      <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                        <Badge className={statusColors[projectSettings.status] || ""}>
                          {phaseLabels[projectSettings.status]?.label || projectSettings.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {phaseLabels[projectSettings.status]?.description}
                        </span>
                      </div>

                      {/* Embedded Phase Tools */}
                      <div className="border rounded-lg p-4 bg-card">
                        <EmbeddedPhaseTools 
                          client={client}
                          project={client.projects?.[0]}
                          status={projectSettings.status}
                        />
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
                          <Label className="flex items-center gap-2">
                            Project Status
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </Label>
                          <Select 
                            value={projectSettings.status} 
                            onValueChange={handleStatusChange}
                          >
                            <SelectTrigger data-testid="select-settings-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {ALL_PROJECT_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">PIN required to change status</p>
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

                  {canEdit && (
                    <Card className="border-destructive/30">
                      <CardHeader>
                        <CardTitle className="font-serif text-lg flex items-center gap-2 text-destructive">
                          <XCircle className="w-4 h-4" />
                          Close Client Account
                        </CardTitle>
                        <CardDescription>Archive this client and mark the project as complete</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <p className="text-sm text-muted-foreground">
                            This will deactivate the client's login access and archive all project data.
                          </p>
                          <Dialog open={isCloseAccountDialogOpen} onOpenChange={setIsCloseAccountDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="destructive" className="gap-2" data-testid="button-close-account">
                                <XCircle className="w-4 h-4" />
                                Close Account
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <CloseAccountForm
                                client={{
                                  id: clientId!,
                                  contactName: client.contactName,
                                  email: client.email,
                                  phone: client.phone,
                                  businessName: client.businessName,
                                  projects: client.projects,
                                }}
                                onSuccess={() => {
                                  setIsCloseAccountDialogOpen(false);
                                  window.location.href = "/admin/clients";
                                }}
                                onCancel={() => setIsCloseAccountDialogOpen(false)}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                {canEdit && (
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
                )}
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

          <TabsContent value="quotes" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Quotes
                  </CardTitle>
                  <CardDescription>{quotes?.length || 0} total quotes</CardDescription>
                </div>
                {canEdit && (
                <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-add-quote">
                      <Plus className="w-4 h-4" />
                      Create Quote
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Quote</DialogTitle>
                      <DialogDescription>Create a pricing proposal for this client</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateQuote} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quote Title *</Label>
                          <Input
                            value={newQuote.title}
                            onChange={(e) => setNewQuote({ ...newQuote, title: e.target.value })}
                            placeholder="e.g., Website Development Proposal"
                            required
                            data-testid="input-quote-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valid Until</Label>
                          <Input
                            type="date"
                            value={newQuote.validUntil}
                            onChange={(e) => setNewQuote({ ...newQuote, validUntil: e.target.value })}
                            data-testid="input-quote-valid-until"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newQuote.description}
                          onChange={(e) => setNewQuote({ ...newQuote, description: e.target.value })}
                          placeholder="Brief description of the quote..."
                          rows={2}
                          data-testid="input-quote-description"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Line Items</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addLineItem} data-testid="button-add-line-item">
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {newQuote.lineItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border">
                              <div className="col-span-4 space-y-1">
                                <Label className="text-xs">Item Name</Label>
                                <Input
                                  value={item.name}
                                  onChange={(e) => updateLineItem(index, "name", e.target.value)}
                                  placeholder="Service name"
                                  data-testid={`input-line-item-name-${index}`}
                                />
                              </div>
                              <div className="col-span-3 space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateLineItem(index, "description", e.target.value)}
                                  placeholder="Details"
                                  data-testid={`input-line-item-desc-${index}`}
                                />
                              </div>
                              <div className="col-span-1 space-y-1">
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
                                <Label className="text-xs">Unit Price</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                  data-testid={`input-line-item-price-${index}`}
                                />
                              </div>
                              <div className="col-span-1 space-y-1">
                                <Label className="text-xs">Total</Label>
                                <p className="h-9 flex items-center font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                              </div>
                              <div className="col-span-1">
                                {newQuote.lineItems.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLineItem(index)}
                                    data-testid={`button-remove-line-item-${index}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Discount Description</Label>
                          <Input
                            value={newQuote.discountDescription}
                            onChange={(e) => setNewQuote({ ...newQuote, discountDescription: e.target.value })}
                            placeholder="e.g., Early bird discount"
                            data-testid="input-quote-discount-desc"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Discount Amount ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newQuote.discountAmount}
                            onChange={(e) => setNewQuote({ ...newQuote, discountAmount: parseFloat(e.target.value) || 0 })}
                            data-testid="input-quote-discount-amount"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={newQuote.taxRate}
                          onChange={(e) => setNewQuote({ ...newQuote, taxRate: parseFloat(e.target.value) || 0 })}
                          className="w-32"
                          data-testid="input-quote-tax-rate"
                        />
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${calculateQuoteTotals().subtotal.toFixed(2)}</span>
                        </div>
                        {newQuote.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span>-${newQuote.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {newQuote.taxRate > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Tax ({newQuote.taxRate}%):</span>
                            <span>${calculateQuoteTotals().taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${calculateQuoteTotals().total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (visible to client)</Label>
                        <Textarea
                          value={newQuote.notes}
                          onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                          placeholder="Additional notes..."
                          rows={2}
                          data-testid="input-quote-notes"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Terms and Conditions</Label>
                        <Textarea
                          value={newQuote.termsAndConditions}
                          onChange={(e) => setNewQuote({ ...newQuote, termsAndConditions: e.target.value })}
                          placeholder="Payment terms, project timeline, etc."
                          rows={3}
                          data-testid="input-quote-terms"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createQuoteMutation.isPending} data-testid="button-submit-quote">
                          {createQuoteMutation.isPending ? "Creating..." : "Create Quote"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {quotesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : quotes && quotes.length > 0 ? (
                  <div className="space-y-4">
                    {quotes.map((quote: any) => {
                      const lineItems = typeof quote.lineItems === 'string' ? JSON.parse(quote.lineItems) : quote.lineItems;
                      return (
                        <div key={quote.id} className="p-4 rounded-lg border space-y-3" data-testid={`quote-${quote.id}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-lg">{quote.title}</p>
                              {quote.description && <p className="text-sm text-muted-foreground">{quote.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                quote.status === "approved" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                                quote.status === "rejected" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                quote.status === "sent" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                quote.status === "viewed" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                                quote.status === "expired" ? "bg-gray-500/10 text-gray-600 dark:text-gray-400" :
                                "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                              }>
                                {quote.status}
                              </Badge>
                              <span className="font-bold text-lg">${quote.totalAmount}</span>
                            </div>
                          </div>
                          
                          {lineItems && lineItems.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {lineItems.length} line item{lineItems.length > 1 ? 's' : ''}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span>Created: {format(new Date(quote.createdAt), "MMM d, yyyy")}</span>
                              {quote.validUntil && (
                                <span>Valid until: {format(new Date(quote.validUntil), "MMM d, yyyy")}</span>
                              )}
                            </div>
                            {canEdit && (
                            <div className="flex items-center gap-2">
                              {quote.status === "draft" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => sendQuoteMutation.mutate(quote.id)}
                                  disabled={sendQuoteMutation.isPending}
                                  data-testid={`button-send-quote-${quote.id}`}
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Send to Client
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this quote?")) {
                                    deleteQuoteMutation.mutate(quote.id);
                                  }
                                }}
                                disabled={deleteQuoteMutation.isPending}
                                data-testid={`button-delete-quote-${quote.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            )}
                          </div>
                          
                          {quote.clientResponse && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-sm font-medium">Client Response:</p>
                              <p className="text-sm text-muted-foreground">{quote.clientResponse}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No quotes yet.{canEdit && ' Click "Create Quote" to make one.'}</p>
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
                {canEdit && (
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
                )}
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
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">${payment.amount}</p>
                            <Badge className={paymentStatusColors[payment.status] || paymentStatusColors.pending}>
                              {payment.status}
                            </Badge>
                          </div>
                          {canEdit && payment.status !== "paid" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this payment?")) {
                                  deletePaymentMutation.mutate(payment.id);
                                }
                              }}
                              disabled={deletePaymentMutation.isPending}
                              data-testid={`button-delete-payment-${payment.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No payments yet.{canEdit && ' Click "Add Payment" to create one.'}</p>
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
                {canEdit && (
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
              )}
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
                          {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this document?")) {
                                deleteDocumentMutation.mutate(doc.id);
                              }
                            }}
                            disabled={deleteDocumentMutation.isPending}
                            data-testid={`button-delete-document-${doc.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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

          <TabsContent value="portal-preview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Client Portal Preview
                </CardTitle>
                <CardDescription>
                  See what your client currently sees on their dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pending Payments Section */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Visible Payments ({client.payments?.filter((p: any) => p.status !== "paid").length || 0})
                  </h3>
                  {client.payments?.filter((p: any) => p.status !== "paid").length > 0 ? (
                    <div className="space-y-2">
                      {client.payments.filter((p: any) => p.status !== "paid").map((payment: any) => (
                        <div 
                          key={payment.id} 
                          className="flex items-center justify-between p-4 rounded-lg border bg-amber-500/5 border-amber-500/30"
                          data-testid={`portal-payment-${payment.id}`}
                        >
                          <div>
                            <p className="font-medium capitalize">{payment.paymentType?.replace('_', ' ') || 'Payment'}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.description || "No description"} - Due: {payment.dueDate ? format(new Date(payment.dueDate), 'MMM d, yyyy') : 'Not set'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">${parseFloat(payment.amount || 0).toFixed(2)}</span>
                            <Badge variant="outline">{payment.status}</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deletePaymentMutation.mutate(payment.id)}
                              disabled={deletePaymentMutation.isPending}
                              data-testid={`button-delete-payment-${payment.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
                      No pending payments showing on client portal
                    </p>
                  )}
                </div>

                {/* Paid Payments Section */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    Paid Payments ({client.payments?.filter((p: any) => p.status === "paid").length || 0})
                  </h3>
                  {client.payments?.filter((p: any) => p.status === "paid").length > 0 ? (
                    <div className="space-y-2">
                      {client.payments.filter((p: any) => p.status === "paid").map((payment: any) => (
                        <div 
                          key={payment.id} 
                          className="flex items-center justify-between p-4 rounded-lg border bg-green-500/5 border-green-500/30"
                          data-testid={`portal-paid-payment-${payment.id}`}
                        >
                          <div>
                            <p className="font-medium capitalize">{payment.paymentType?.replace('_', ' ') || 'Payment'}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.description || "No description"} - Paid: {payment.paidAt ? format(new Date(payment.paidAt), 'MMM d, yyyy') : 'Unknown'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">${parseFloat(payment.amount || 0).toFixed(2)}</span>
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Paid</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
                      No paid payments yet
                    </p>
                  )}
                </div>

                {/* Pending Documents Section */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Pending Documents ({client.documents?.filter((d: any) => d.requiresSignature && !d.signedAt).length || 0})
                  </h3>
                  {client.documents?.filter((d: any) => d.requiresSignature && !d.signedAt).length > 0 ? (
                    <div className="space-y-2">
                      {client.documents.filter((d: any) => d.requiresSignature && !d.signedAt).map((doc: any) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-4 rounded-lg border"
                          data-testid={`portal-document-${doc.id}`}
                        >
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">{doc.documentType}</p>
                          </div>
                          <Badge variant="outline">Awaiting Signature</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
                      No pending documents on client portal
                    </p>
                  )}
                </div>

                {/* Hosting Setup Section - Phase 7A */}
                {(client.projects?.[0]?.status === "hosting_setup_pending" || client.projects?.[0]?.hostingerEmail) && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Hosting Setup (Phase 7A)
                    </h3>
                    <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/30 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Target Domain</Label>
                          <p className="font-medium">{client.projects?.[0]?.domainName || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Credentials Status</Label>
                          <p className="font-medium flex items-center gap-2">
                            {client.projects?.[0]?.hostingCredentialsReceived ? (
                              <>
                                <Check className="w-4 h-4 text-green-600" />
                                Received
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                Waiting for client
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      {client.projects?.[0]?.hostingerEmail && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <Label className="text-xs text-muted-foreground">Hostinger Email</Label>
                            <p className="font-medium">{client.projects[0].hostingerEmail}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Temp Password</Label>
                            <p className="font-medium font-mono">{client.projects[0].hostingerTempPassword}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* PIN Verification Modal for Status Override */}
      <Dialog open={showPinModal} onOpenChange={(open) => {
        if (!open) {
          setShowPinModal(false);
          setPinValue("");
          setPinError("");
          setPendingStatus(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Verify PIN to Change Status
            </DialogTitle>
            <DialogDescription>
              Changing project status requires PIN verification. Enter your 5-digit PIN to confirm this change.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Status Change:</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Badge className={statusColors[originalStatus] || ""}>
                  {phaseLabels[originalStatus]?.label || originalStatus}
                </Badge>
                <span className="text-muted-foreground">to</span>
                <Badge className={statusColors[pendingStatus || ""] || ""}>
                  {phaseLabels[pendingStatus || ""]?.label || pendingStatus}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <InputOTP 
                maxLength={5} 
                value={pinValue}
                onChange={setPinValue}
                data-testid="input-pin-override"
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyPin}
              disabled={isVerifyingPin || pinValue.length !== 5}
              data-testid="button-verify-pin"
            >
              {isVerifyingPin ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Verify & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
