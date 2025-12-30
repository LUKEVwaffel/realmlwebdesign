import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  CreditCard, 
  FileSignature, 
  CheckCircle2, 
  ArrowRight,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  ClipboardList,
  Palette,
  Code,
  Rocket,
  Eye,
  PartyPopper,
  FileText,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Globe,
  Lock,
  Mail,
  Key
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

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

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 }
};

const phases = [
  { id: 1, name: "Onboarding", icon: User, statuses: ["created", "draft"] },
  { id: 2, name: "Questionnaire", icon: ClipboardList, statuses: ["questionnaire_pending", "questionnaire_complete"] },
  { id: 3, name: "Agreement", icon: FileSignature, statuses: ["quote_draft", "quote_sent", "quote_approved", "tos_pending", "tos_signed", "deposit_pending", "deposit_paid"] },
  { id: 4, name: "Design", icon: Palette, statuses: ["design_pending", "design_sent", "design_approved"] },
  { id: 5, name: "Development", icon: Code, statuses: ["in_development"] },
  { id: 6, name: "Review", icon: Eye, statuses: ["ready_for_review", "client_review", "revisions_pending", "revisions_complete", "awaiting_final_payment", "payment_complete"] },
  { id: 7, name: "Complete", icon: PartyPopper, statuses: ["hosting_setup_pending", "hosting_configured", "completed"] },
];

const getPhaseFromStatus = (status: string): number => {
  const phase = phases.find(p => p.statuses.includes(status));
  return phase?.id || 1;
};

const getNextAction = (status: string, hasUnsignedDocs: boolean, hasPendingPayments: boolean): {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  icon: any;
  priority: "high" | "medium" | "low";
  pulse?: boolean;
} | null => {
  if (hasPendingPayments) {
    return {
      title: "Payment Required",
      description: "You have an outstanding payment that needs to be completed to continue with your project.",
      buttonText: "Make Payment",
      href: "/client/payments",
      icon: CreditCard,
      priority: "high",
      pulse: true
    };
  }

  if (hasUnsignedDocs || status === "tos_pending") {
    return {
      title: "Document Signature Needed",
      description: "Please review and sign the Terms of Service to proceed with your project.",
      buttonText: "Review & Sign",
      href: "/client/documents",
      icon: FileSignature,
      priority: "high",
      pulse: true
    };
  }

  if (status === "questionnaire_pending") {
    return {
      title: "Complete Your Questionnaire",
      description: "Help us understand your vision by answering a few questions about your project.",
      buttonText: "Start Questionnaire",
      href: "/client/questionnaire",
      icon: ClipboardList,
      priority: "high",
      pulse: true
    };
  }

  if (status === "design_sent") {
    return {
      title: "Choose Your Design",
      description: "We've prepared design options for you! Check your documents for the design options.",
      buttonText: "View Designs",
      href: "/client/documents",
      icon: Palette,
      priority: "high",
      pulse: true
    };
  }

  if (status === "client_review") {
    return {
      title: "Review Your Website",
      description: "Your website is ready for review! Take a look and let us know what you think.",
      buttonText: "Review Now",
      href: "/client/dashboard",
      icon: Eye,
      priority: "high",
      pulse: true
    };
  }

  if (status === "revisions_pending" || status === "revisions_complete") {
    return {
      title: "Revisions In Progress",
      description: "We're working on the changes you requested. We'll notify you when they're ready.",
      buttonText: "View Progress",
      href: "/client/dashboard",
      icon: RefreshCw,
      priority: "medium"
    };
  }

  if (status === "awaiting_final_payment") {
    if (hasPendingPayments) {
      return {
        title: "Final Payment Required",
        description: "Your website is approved! Scroll down to the Payments Due section to complete your final payment.",
        buttonText: "See Payment Below",
        href: "#payments-section",
        icon: CreditCard,
        priority: "high",
        pulse: true
      };
    } else {
      return {
        title: "Invoice Being Prepared",
        description: "Your website is approved and ready! We're preparing your final invoice - you'll be notified shortly.",
        buttonText: "View Status",
        href: "/client/dashboard",
        icon: Clock,
        priority: "medium"
      };
    }
  }

  if (status === "payment_complete") {
    return {
      title: "Payment Complete!",
      description: "Your payment has been received. We're preparing the next step for your website.",
      buttonText: "View Status",
      href: "/client/dashboard",
      icon: Rocket,
      priority: "medium"
    };
  }

  if (status === "hosting_setup_pending") {
    return {
      title: "Set Up Your Hosting Account",
      description: "We need you to create a Hostinger account so we can configure your website hosting. See instructions below.",
      buttonText: "See Instructions Below",
      href: "#hosting-setup",
      icon: Globe,
      priority: "high",
      pulse: true
    };
  }

  if (status === "hosting_configured") {
    return {
      title: "Almost There!",
      description: "We're putting the finishing touches on your website. You'll be notified when it's live!",
      buttonText: "View Status",
      href: "/client/dashboard",
      icon: Rocket,
      priority: "medium"
    };
  }

  if (status === "in_development") {
    return {
      title: "We're Building Your Site",
      description: "Our team is hard at work creating your website. We'll notify you when it's ready for review.",
      buttonText: "View Documents",
      href: "/client/documents",
      icon: Code,
      priority: "low"
    };
  }

  if (status === "completed") {
    return {
      title: "Your Website is Live!",
      description: "Congratulations! Your project is complete. Your 25-day warranty is now active.",
      buttonText: "View Documents",
      href: "/client/documents",
      icon: PartyPopper,
      priority: "low"
    };
  }

  return {
    title: "We're Working On It",
    description: "Your project is progressing. We'll reach out when we need anything from you.",
    buttonText: "View Documents",
    href: "/client/documents",
    icon: Clock,
    priority: "low"
  };
};

const statusLabels: Record<string, string> = {
  created: "Getting Started",
  draft: "Getting Started",
  questionnaire_pending: "Questionnaire Pending",
  questionnaire_complete: "Questionnaire Complete",
  quote_draft: "Preparing Quote",
  quote_sent: "Quote Sent",
  quote_approved: "Quote Approved",
  tos_pending: "Awaiting Signature",
  tos_signed: "Agreement Signed",
  deposit_pending: "Awaiting Deposit",
  deposit_paid: "Deposit Received",
  design_pending: "Preparing Designs",
  design_sent: "Designs Ready",
  design_approved: "Design Approved",
  in_development: "In Development",
  ready_for_review: "Ready for QA",
  client_review: "Your Review",
  revisions_pending: "Revisions in Progress",
  revisions_complete: "Revisions Complete",
  awaiting_final_payment: "Awaiting Final Payment",
  payment_complete: "Payment Complete",
  hosting_setup_pending: "Setting Up Hosting",
  hosting_configured: "Hosting Ready",
  completed: "Project Complete",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

function JourneyTimeline({ currentPhase, status }: { currentPhase: number; status: string }) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 rounded-full" />
        <motion.div 
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/50 -translate-y-1/2 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.max(0, ((currentPhase - 1) / 6) * 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        />
        
        {phases.map((phase, index) => {
          const isComplete = currentPhase > phase.id;
          const isCurrent = currentPhase === phase.id;
          const Icon = phase.icon;
          
          return (
            <motion.div
              key={phase.id}
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isComplete
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>
              <span className={`mt-2 text-xs font-medium hidden sm:block ${
                isCurrent ? "text-primary" : isComplete ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              }`}>
                {phase.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function NextActionCard({ action, isLoading }: { action: ReturnType<typeof getNextAction>; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-12 w-40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!action) return null;

  const Icon = action.icon;
  const priorityStyles = {
    high: "border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5",
    medium: "border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5",
    low: "border border-border/50"
  };

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className={`${priorityStyles[action.priority]} overflow-hidden relative`}>
        {action.pulse && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          />
        )}
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Your Next Step</span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <motion.div 
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                action.priority === "high" 
                  ? "bg-primary/10" 
                  : action.priority === "medium" 
                    ? "bg-amber-500/10" 
                    : "bg-muted"
              }`}
              animate={action.pulse ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: action.pulse ? Infinity : 0, duration: 2 }}
            >
              <Icon className={`w-8 h-8 ${
                action.priority === "high" 
                  ? "text-primary" 
                  : action.priority === "medium" 
                    ? "text-amber-600 dark:text-amber-400" 
                    : "text-muted-foreground"
              }`} />
            </motion.div>
            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-semibold">{action.title}</h2>
              <p className="text-muted-foreground">{action.description}</p>
            </div>
            <Link href={action.href}>
              <Button 
                size="lg" 
                className={`gap-2 min-w-[160px] ${action.priority === "high" ? "" : "variant-outline"}`}
                variant={action.priority === "high" ? "default" : "outline"}
                data-testid="button-next-action"
              >
                {action.buttonText}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActivityItem({ activity, index }: { activity: any; index: number }) {
  return (
    <motion.div
      className="flex items-start gap-4 py-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  );
}

function DevelopmentFeedbackPanel({ projectId }: { projectId: string }) {
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const sendFeedbackMutation = useMutation({
    mutationFn: async (data: { messageText: string; category: string; projectId: string }) => {
      const res = await apiRequest("POST", "/api/client/messages", data);
      return res.json();
    },
    onSuccess: () => {
      setFeedback("");
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages"] });
      toast({
        title: "Feedback sent",
        description: "Your feedback has been sent to the team.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    sendFeedbackMutation.mutate({
      messageText: feedback.trim(),
      category: "development_feedback",
      projectId,
    });
  };

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-background to-blue-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Share Your Feedback</CardTitle>
              <CardDescription>
                Reviewing your website? Share any feedback or revision requests here.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share any feedback, revision requests, or comments about your website..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px] resize-none"
            data-testid="input-development-feedback"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || sendFeedbackMutation.isPending}
              className="gap-2"
              data-testid="button-send-feedback"
            >
              {sendFeedbackMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WebsiteReviewPanel({ project, onApprove, onRequestChanges, isApproving, isRequestingChanges }: { 
  project: any; 
  onApprove: () => void; 
  onRequestChanges: (feedback: string) => void;
  isApproving: boolean;
  isRequestingChanges: boolean;
}) {
  const [feedback, setFeedback] = useState("");

  const handleRequestChanges = () => {
    onRequestChanges(feedback.trim());
    setFeedback("");
  };

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Eye className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-xl">Your Website is Ready for Review!</CardTitle>
              <CardDescription>
                Take a look at your website and let us know what you think.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.stagingUrl && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium">Preview Your Website</p>
                  <p className="text-sm text-muted-foreground">Click to open your website in a new tab</p>
                </div>
                <a 
                  href={project.stagingUrl.startsWith('http') ? project.stagingUrl : `https://${project.stagingUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2" data-testid="button-preview-website">
                    <ExternalLink className="w-4 h-4" />
                    Open Website
                  </Button>
                </a>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Have any feedback or changes?</p>
            <Textarea
              placeholder="Let us know if there's anything you'd like us to change..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="input-review-feedback"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleRequestChanges}
              disabled={isApproving || isRequestingChanges}
              data-testid="button-request-changes"
            >
              {isRequestingChanges ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ThumbsDown className="w-4 h-4" />
              )}
              Request Changes
            </Button>
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              onClick={onApprove}
              disabled={isApproving || isRequestingChanges}
              data-testid="button-approve-website"
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ThumbsUp className="w-4 h-4" />
              )}
              I Love It - Approve & Pay
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Approving will move you to final payment to receive your completed website.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PaymentItem({ payment }: { payment: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayNow = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", `/api/payments/${payment.id}/checkout`);
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Unable to start payment. Please try again or contact support.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg bg-background border"
      data-testid={`payment-item-${payment.id}`}
    >
      <div>
        <p className="font-medium capitalize">{payment.paymentType?.replace('_', ' ') || 'Payment'}</p>
        <p className="text-sm text-muted-foreground">
          Due: {payment.dueDate ? format(new Date(payment.dueDate), 'MMM d, yyyy') : 'Soon'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">${parseFloat(payment.amount || 0).toFixed(2)}</span>
        <Button 
          size="sm" 
          className="gap-2" 
          onClick={handlePayNow}
          disabled={isLoading}
          data-testid={`button-pay-${payment.id}`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          Pay Now
        </Button>
      </div>
    </div>
  );
}

function HostingSetupPanel({ project }: { project: any }) {
  const [hostingerEmail, setHostingerEmail] = useState(project?.hostingerEmail || "");
  const [tempPassword, setTempPassword] = useState(project?.hostingerTempPassword || "");
  const { toast } = useToast();

  const submitCredentialsMutation = useMutation({
    mutationFn: async (data: { email: string; tempPassword: string }) => {
      const res = await apiRequest("POST", `/api/client/projects/${project.id}/hosting-credentials`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/dashboard"] });
      toast({ title: "Credentials submitted!", description: "We'll begin configuring your hosting shortly." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit credentials", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostingerEmail || !tempPassword) {
      toast({ title: "Missing information", description: "Please enter both email and temporary password.", variant: "destructive" });
      return;
    }
    submitCredentialsMutation.mutate({ email: hostingerEmail, tempPassword });
  };

  // Already submitted
  if (project?.hostingCredentialsReceived) {
    return (
      <motion.div variants={fadeInUp}>
        <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 via-background to-green-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Hosting Credentials Received</CardTitle>
                <CardDescription>
                  We're configuring your website hosting now
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Your website:</span>
                <span className="font-medium">{project.domainName || "Being configured..."}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll notify you once your website is live!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-background to-blue-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div>
              <CardTitle className="text-lg">Set Up Your Hosting Account</CardTitle>
              <CardDescription>
                Action required - Create your Hostinger account
              </CardDescription>
            </div>
            <Badge className="ml-auto bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Action Required
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domain Display */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="font-medium">Your Website Domain</span>
            </div>
            <p className="text-xl font-bold text-primary">{project?.domainName || "your-business.com"}</p>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Setup Instructions
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">1</div>
                <div>
                  <p className="font-medium">Go to hostinger.com</p>
                  <p className="text-muted-foreground">Click "My Account" then "Sign Up"</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">2</div>
                <div>
                  <p className="font-medium">Create account manually</p>
                  <p className="text-muted-foreground">Do NOT use Google or other sign-in options</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">3</div>
                <div>
                  <p className="font-medium">Use a temporary password</p>
                  <p className="text-muted-foreground">Example: TempPass2025! - You'll change this after setup</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">Important</p>
                  <p className="text-muted-foreground">We need temporary access to configure your hosting. Once complete, you'll set a new password only you know.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Credential Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              Submit Your Hostinger Credentials
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hostinger-email" className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Hostinger Email
                </Label>
                <Input
                  id="hostinger-email"
                  type="email"
                  placeholder="your@email.com"
                  value={hostingerEmail}
                  onChange={(e) => setHostingerEmail(e.target.value)}
                  data-testid="input-hostinger-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp-password" className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Temporary Password
                </Label>
                <Input
                  id="temp-password"
                  type="text"
                  placeholder="TempPass2025!"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  data-testid="input-hostinger-password"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full gap-2"
              disabled={submitCredentialsMutation.isPending || !hostingerEmail || !tempPassword}
              data-testid="button-submit-hosting-credentials"
            >
              {submitCredentialsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Credentials
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PendingPaymentsPanel({ payments }: { payments: any[] }) {
  if (payments.length === 0) return null;

  return (
    <motion.div variants={fadeInUp} id="payments-section">
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Payments Due</CardTitle>
              <CardDescription>
                You have {payments.length} payment{payments.length !== 1 ? 's' : ''} waiting
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.map((payment: any) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PendingDocumentsPanel({ documents }: { documents: any[] }) {
  if (documents.length === 0) return null;

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-background to-blue-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Documents Requiring Signature</CardTitle>
              <CardDescription>
                Please review and sign {documents.length} document{documents.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map((doc: any) => (
            <div 
              key={doc.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-background border"
              data-testid={`document-item-${doc.id}`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{doc.documentName || doc.documentType}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {doc.documentType?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <Link href="/client/documents">
                <Button size="sm" className="gap-2" data-testid={`button-sign-${doc.id}`}>
                  <FileSignature className="w-4 h-4" />
                  Review & Sign
                </Button>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery<{
    project: any;
    pendingPayments: any[];
    unsignedDocuments: any[];
    recentActivity: any[];
  }>({
    queryKey: ["/api/client/dashboard"],
  });

  const project = dashboardData?.project;
  const pendingPayments = dashboardData?.pendingPayments || [];
  const unsignedDocuments = dashboardData?.unsignedDocuments || [];
  const recentActivity = dashboardData?.recentActivity || [];
  
  const { data: warrantyData, isLoading: warrantyLoading } = useQuery<{
    warranty: {
      projectId: string;
      startDate: string;
      endDate: string;
      daysRemaining: number;
      isExpired: boolean;
      isExpiringSoon: boolean;
    } | null;
  }>({
    queryKey: ["/api/client/warranty"],
    enabled: project?.status === "completed",
  });
  
  const warranty = warrantyData?.warranty;
  const currentPhase = project ? getPhaseFromStatus(project.status) : 1;
  const nextAction = project ? getNextAction(
    project.status, 
    unsignedDocuments.length > 0, 
    pendingPayments.length > 0
  ) : null;
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/client/projects/${project?.id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/dashboard"] });
      toast({
        title: "Website Approved!",
        description: "Great choice! You'll now proceed to final payment.",
      });
    },
    onError: () => {
      toast({
        title: "Approval failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: async (feedback: string) => {
      const res = await apiRequest("POST", `/api/client/projects/${project?.id}/request-changes`, { feedback });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages"] });
      toast({
        title: "Revision request sent",
        description: "We'll get started on the changes right away.",
      });
    },
    onError: () => {
      toast({
        title: "Request failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  return (
    <PortalLayout requiredRole="client">
      <motion.div 
        className="p-6 space-y-8 max-w-6xl mx-auto"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <motion.h1 
                className="font-serif text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                data-testid="text-welcome"
              >
                Welcome back, {user?.firstName}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground mt-2 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {project ? (
                  <>Your project is in <span className="font-medium text-foreground">{statusLabels[project.status] || project.status}</span> phase</>
                ) : (
                  "Let's get started on your project"
                )}
              </motion.p>
            </div>
            {project && (
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold text-primary">
                    {project.progressPercentage === -1 
                      ? (project.status === "on_hold" ? "Paused" : "--")
                      : `${project.progressPercentage || 0}%`
                    }
                  </p>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-primary"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ 
                        pathLength: project.progressPercentage === -1 ? 0 : (project.progressPercentage || 0) / 100 
                      }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    />
                  </svg>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {project && (
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-6">
                <JourneyTimeline currentPhase={currentPhase} status={project.status} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        <NextActionCard action={nextAction} isLoading={isLoading} />

        {/* Hosting Setup Panel - for hosting_setup_pending status */}
        {project?.status === "hosting_setup_pending" && project?.id && (
          <div id="hosting-setup">
            <HostingSetupPanel project={project} />
          </div>
        )}

        {/* Website Review Panel - for client_review status */}
        {project?.status === "client_review" && project?.id && (
          <WebsiteReviewPanel 
            project={project}
            onApprove={() => approveMutation.mutate()}
            onRequestChanges={(feedback: string) => requestChangesMutation.mutate(feedback)}
            isApproving={approveMutation.isPending}
            isRequestingChanges={requestChangesMutation.isPending}
          />
        )}

        {/* Feedback panel for revisions phase */}
        {(project?.status === "revisions_pending" || project?.status === "revisions_complete") && project?.id && (
          <DevelopmentFeedbackPanel projectId={project.id} />
        )}

        {/* Pending Payments Panel */}
        <PendingPaymentsPanel payments={pendingPayments} />

        {/* Pending Documents Panel */}
        <PendingDocumentsPanel documents={unsignedDocuments} />

        {project?.status === "completed" && warranty && !warranty.isExpired && (
          <motion.div variants={fadeInUp}>
            <Card 
              className={`overflow-hidden ${
                warranty.isExpiringSoon 
                  ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background" 
                  : "border-green-500/30 bg-gradient-to-br from-green-500/5 to-background"
              }`}
              data-testid="card-warranty"
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        warranty.isExpiringSoon ? "bg-amber-500/10" : "bg-green-500/10"
                      }`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      {warranty.isExpiringSoon ? (
                        <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
                      )}
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">25-Day Warranty</h3>
                        <Badge variant="outline" className={
                          warranty.isExpiringSoon 
                            ? "border-amber-500/50 text-amber-600 dark:text-amber-400" 
                            : "border-green-500/50 text-green-600 dark:text-green-400"
                        }>
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Free bug fixes until {warranty.endDate && format(new Date(warranty.endDate), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <motion.div 
                    className="flex flex-col items-center justify-center px-8 py-4 bg-background rounded-xl border"
                    animate={warranty.isExpiringSoon ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ repeat: warranty.isExpiringSoon ? Infinity : 0, duration: 2 }}
                  >
                    <span className={`text-4xl font-bold ${
                      warranty.isExpiringSoon 
                        ? "text-amber-600 dark:text-amber-400" 
                        : "text-green-600 dark:text-green-400"
                    }`}>
                      {warranty.daysRemaining}
                    </span>
                    <span className="text-sm text-muted-foreground">days left</span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        <motion.div variants={fadeInUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    className="space-y-4 py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Skeleton className="w-2 h-2 rounded-full mt-2" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-1" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : recentActivity.length > 0 ? (
                  <motion.div 
                    className="divide-y divide-border/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                      <ActivityItem key={activity.id} activity={activity} index={index} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.p 
                    className="text-muted-foreground text-sm text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No recent activity to show
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {project?.stagingUrl && project.status !== "completed" && (
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50 bg-gradient-to-r from-blue-500/5 via-background to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Preview Your Website</h3>
                      <p className="text-sm text-muted-foreground">
                        View the current development version
                      </p>
                    </div>
                  </div>
                  <a 
                    href={project.stagingUrl.startsWith('http') ? project.stagingUrl : `https://${project.stagingUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="gap-2" data-testid="button-preview-site">
                      Open Preview
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </PortalLayout>
  );
}
