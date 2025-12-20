import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  FolderKanban, 
  DollarSign, 
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Medal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/leaderboard"],
  });

  const stats = dashboardData?.stats || {
    totalClients: 0,
    activeProjects: 0,
    totalRevenue: 0,
    completionRate: 0,
  };
  const recentProjects = dashboardData?.recentProjects || [];
  const overduePayments = dashboardData?.overduePayments || [];
  const recentActivity = dashboardData?.recentActivity || [];

  const metricCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: FolderKanban,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-welcome">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your business
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((metric) => (
            <Card key={metric.title} className="border-border/50" data-testid={`card-metric-${metric.title.toLowerCase().replace(/\s/g, '-')}`}>
              <CardContent className="p-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{metric.title}</span>
                      <div className={`w-8 h-8 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                        <metric.icon className={`w-4 h-4 ${metric.color}`} />
                      </div>
                    </div>
                    <p className="font-serif text-2xl font-bold mt-2">{metric.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Leaderboard */}
        {leaderboard && leaderboard.length > 1 && (
          <Card className="border-border/50" data-testid="card-leaderboard">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="font-serif text-lg">Team Leaderboard</CardTitle>
                <CardDescription>Compare performance across developers</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard?.map((admin: any, index: number) => (
                    <div
                      key={admin.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        admin.id === user?.id ? "bg-primary/5 border border-primary/20" : ""
                      }`}
                      data-testid={`leaderboard-item-${admin.id}`}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={index === 0 ? "bg-yellow-500/20 text-yellow-600" : "bg-muted"}>
                            {admin.firstName?.[0]}{admin.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Medal className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {admin.firstName} {admin.lastName}
                          {admin.id === user?.id && (
                            <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {admin.totalClients} clients
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${admin.totalRevenue?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {admin.completedProjects} completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card className="border-border/50" data-testid="card-recent-projects">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-lg">Recent Projects</CardTitle>
                <CardDescription>Latest project updates</CardDescription>
              </div>
              <Link href="/admin/projects">
                <Button variant="ghost" size="sm" className="gap-1" data-testid="button-view-all-projects">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((project: any) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                      data-testid={`project-item-${project.id}`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {project.client?.businessLegalName || "Unknown Client"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {project.projectType?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge className={statusColors[project.status] || "bg-muted"}>
                        {statusLabels[project.status] || project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No projects yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Payments */}
          <Card className="border-border/50" data-testid="card-overdue-payments">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-lg">Attention Needed</CardTitle>
                <CardDescription>Overdue payments and pending items</CardDescription>
              </div>
              <Link href="/admin/analytics">
                <Button variant="ghost" size="sm" className="gap-1" data-testid="button-view-analytics">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : overduePayments.length > 0 ? (
                <div className="space-y-3">
                  {overduePayments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-4 py-2 border-b last:border-0"
                      data-testid={`overdue-item-${payment.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {payment.client?.businessLegalName || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(payment.amount).toLocaleString()} overdue
                        </p>
                      </div>
                      <Badge variant="destructive" className="shrink-0">Overdue</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500/50 mb-2" />
                  <p className="text-muted-foreground">All caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/50" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
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
