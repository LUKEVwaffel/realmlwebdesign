import { useQuery } from "@tanstack/react-query";
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
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useAuth } from "@/lib/auth-context";
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
      description: "Your website is ready for review! Take a look and let us know if you need any changes.",
      buttonText: "Send Feedback",
      href: "/client/documents",
      icon: Eye,
      priority: "high",
      pulse: true
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

function QuickLinkCard({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  badge 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  href: string; 
  badge?: string;
}) {
  return (
    <motion.div variants={fadeInUp}>
      <Link href={href}>
        <Card className="hover-elevate cursor-pointer h-full transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{title}</h3>
                  {badge && (
                    <Badge variant="secondary" className="text-xs">{badge}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
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

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
        >
          <QuickLinkCard
            icon={FileText}
            title="Documents"
            description="View contracts and agreements"
            href="/client/documents"
            badge={unsignedDocuments.length > 0 ? `${unsignedDocuments.length} pending` : undefined}
          />
          <QuickLinkCard
            icon={CreditCard}
            title="Payments"
            description="View invoices and payment history"
            href="/client/payments"
            badge={pendingPayments.length > 0 ? `${pendingPayments.length} due` : undefined}
          />
          <QuickLinkCard
            icon={MessageSquare}
            title="Messages"
            description="Contact our team"
            href="/client/messages"
          />
        </motion.div>

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
