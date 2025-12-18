import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Clock, 
  CreditCard, 
  FileSignature, 
  CheckCircle2, 
  ArrowRight,
  Calendar,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow, format } from "date-fns";

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

const phaseInfo: Record<string, { label: string; phase: number; action: string; description: string }> = {
  created: { label: "Getting Started", phase: 1, action: "Complete your profile", description: "Your account is set up! Complete the questionnaire to help us understand your vision." },
  questionnaire_pending: { label: "Questionnaire", phase: 2, action: "Complete questionnaire", description: "Please fill out the project questionnaire so we can understand your needs." },
  questionnaire_complete: { label: "Questionnaire Complete", phase: 2, action: "Awaiting review", description: "Thank you! We're reviewing your questionnaire responses." },
  tos_pending: { label: "Terms of Service", phase: 3, action: "Sign terms", description: "Please review and sign the Terms of Service to proceed with your project." },
  tos_signed: { label: "TOS Complete", phase: 3, action: "Development starting", description: "Great! Development will begin shortly." },
  design_pending: { label: "In Development", phase: 4, action: "Building your site", description: "Our team is actively building your website." },
  design_approved: { label: "In Development", phase: 4, action: "Building your site", description: "Our team is actively building your website." },
  in_development: { label: "In Development", phase: 4, action: "Building your site", description: "Our team is actively building your website. We'll notify you when it's ready for review." },
  hosting_setup: { label: "Hosting Setup", phase: 5, action: "Setting up hosting", description: "We're configuring your hosting and domain settings." },
  deployed: { label: "Deployed", phase: 5, action: "Site is live", description: "Your website has been deployed to the hosting server." },
  delivery: { label: "Final Delivery", phase: 6, action: "Review final site", description: "Your website is ready for final review before handoff." },
  client_review: { label: "Your Review", phase: 6, action: "Approve final delivery", description: "Please review your completed website and let us know of any final changes." },
  completed: { label: "Project Complete", phase: 7, action: "Site is yours!", description: "Congratulations! Your project is complete and your website is live." },
  on_hold: { label: "On Hold", phase: 0, action: "Contact us", description: "Your project is currently on hold. Please contact us for more information." },
  cancelled: { label: "Cancelled", phase: 0, action: "Contact us", description: "This project has been cancelled. Please contact us if you have questions." },
};

const statusLabels: Record<string, string> = Object.fromEntries(
  Object.entries(phaseInfo).map(([key, val]) => [key, val.label])
);

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/client/dashboard"],
  });

  const project = dashboardData?.project;
  const pendingPayments = dashboardData?.pendingPayments || [];
  const unsignedDocuments = dashboardData?.unsignedDocuments || [];
  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <PortalLayout requiredRole="client">
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-welcome">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your project
          </p>
        </div>

        {/* Project Overview */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ) : project ? (
          <Card className="border-border/50" data-testid="card-project-overview">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="font-serif text-xl">
                    {project.client?.businessLegalName || "Your Project"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {project.projectType?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} Website
                  </CardDescription>
                </div>
                <Badge className={statusColors[project.status] || "bg-muted"}>
                  {statusLabels[project.status] || project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progressPercentage || 0}%</span>
                </div>
                <Progress value={project.progressPercentage || 0} className="h-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Designer:</span>
                  <span className="font-medium">Alex Rivera</span>
                </div>
                {project.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-medium">
                      {format(new Date(project.startDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {project.expectedCompletionDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-medium">
                      {format(new Date(project.expectedCompletionDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>

              {phaseInfo[project.status] && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Current Phase:</span>
                      <Badge variant="outline" className="font-medium">
                        Phase {phaseInfo[project.status]?.phase || 0} of 7
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Next Action:</span>
                      <span className="text-sm font-medium">{phaseInfo[project.status]?.action}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {phaseInfo[project.status]?.description}
                  </p>
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((phase) => {
                      const currentPhase = phaseInfo[project.status]?.phase || 0;
                      const isComplete = currentPhase > phase;
                      const isCurrent = currentPhase === phase;
                      return (
                        <div
                          key={phase}
                          className={`flex-1 h-2 rounded-full transition-all ${
                            isCurrent 
                              ? "bg-primary" 
                              : isComplete 
                                ? "bg-green-500" 
                                : "bg-muted"
                          }`}
                          data-testid={`phase-bar-${phase}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No active project found.</p>
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Payments */}
          {pendingPayments.length > 0 ? (
            <Card className="border-destructive/30 bg-destructive/5" data-testid="card-pending-payment">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Payment Due</CardTitle>
                    <CardDescription>Action required</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pendingPayments.slice(0, 1).map((payment: any) => (
                  <div key={payment.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">{payment.description}</span>
                      <span className="font-serif font-bold text-lg">
                        ${parseFloat(payment.amount).toLocaleString()}
                      </span>
                    </div>
                    {payment.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(payment.dueDate), "MMMM d, yyyy")}
                      </p>
                    )}
                    <Link href="/client/payments">
                      <Button className="w-full gap-2" data-testid="button-pay-now">
                        Pay Now
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50" data-testid="card-no-payments">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">No Payments Due</h3>
                  <p className="text-sm text-muted-foreground">
                    You're all caught up with payments
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Needing Signature */}
          {unsignedDocuments.length > 0 ? (
            <Card className="border-primary/30 bg-primary/5" data-testid="card-unsigned-docs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSignature className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Signature Required</CardTitle>
                    <CardDescription>Document awaiting your signature</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {unsignedDocuments.slice(0, 1).map((doc: any) => (
                  <div key={doc.id} className="space-y-3">
                    <p className="font-medium">{doc.title}</p>
                    <Link href="/client/documents">
                      <Button variant="outline" className="w-full gap-2" data-testid="button-review-sign">
                        Review & Sign
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50" data-testid="card-no-docs">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">All Documents Signed</h3>
                  <p className="text-sm text-muted-foreground">
                    No documents need your attention
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <Card className="border-border/50" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="w-2 h-2 rounded-full mt-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No recent activity to show
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
