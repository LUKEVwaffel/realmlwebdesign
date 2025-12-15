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
  pending_payment: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  design_review: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  development: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  client_review: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  revisions: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_hold: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  in_progress: "In Progress",
  design_review: "Design Review",
  development: "Development",
  client_review: "Client Review",
  revisions: "Revisions",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

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
