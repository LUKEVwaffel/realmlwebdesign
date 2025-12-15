import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  FolderKanban, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal/portal-layout";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500",
  in_progress: "bg-blue-500",
  design_review: "bg-purple-500",
  development: "bg-cyan-500",
  client_review: "bg-orange-500",
  revisions: "bg-pink-500",
  completed: "bg-green-500",
  on_hold: "bg-gray-500",
  cancelled: "bg-red-500",
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

export default function AdminAnalytics() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  const stats = analyticsData?.stats || {
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    averageProjectValue: 0,
    completionRate: 0,
    averageProjectDuration: 0,
  };

  const projectsByStatus = analyticsData?.projectsByStatus || [];
  const revenueByMonth = analyticsData?.revenueByMonth || [];
  const topClients = analyticsData?.topClients || [];

  const metricCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      description: "Active clients in system",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: FolderKanban,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      description: `${stats.completedProjects} completed`,
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      description: `$${stats.pendingRevenue.toLocaleString()} pending`,
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
      description: "Project success rate",
    },
  ];

  const secondaryMetrics = [
    {
      title: "Avg Project Value",
      value: `$${stats.averageProjectValue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "Avg Duration",
      value: `${stats.averageProjectDuration} weeks`,
      icon: Clock,
    },
    {
      title: "Completed",
      value: stats.completedProjects,
      icon: CheckCircle2,
    },
    {
      title: "Cancelled",
      value: analyticsData?.cancelledProjects || 0,
      icon: XCircle,
    },
  ];

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Business performance and insights
          </p>
        </div>

        {/* Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((metric) => (
            <Card key={metric.title} className="border-border/50" data-testid={`card-metric-${metric.title.toLowerCase().replace(/\s/g, '-')}`}>
              <CardContent className="p-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{metric.title}</span>
                      <div className={`w-10 h-10 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                        <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      </div>
                    </div>
                    <p className="font-serif text-3xl font-bold mt-2">{metric.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{metric.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {secondaryMetrics.map((metric) => (
            <Card key={metric.title} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <metric.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{metric.value}</p>
                      <p className="text-xs text-muted-foreground truncate">{metric.title}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects by Status */}
          <Card className="border-border/50" data-testid="card-projects-by-status">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Projects by Status</CardTitle>
              <CardDescription>Distribution of project statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : projectsByStatus.length > 0 ? (
                <div className="space-y-4">
                  {projectsByStatus.map((item: any) => {
                    const total = projectsByStatus.reduce((sum: number, s: any) => sum + s.count, 0);
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item.status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {statusLabels[item.status] || item.status}
                          </span>
                          <span className="text-muted-foreground">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${statusColors[item.status] || "bg-gray-500"} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No project data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Clients by Revenue */}
          <Card className="border-border/50" data-testid="card-top-clients">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Top Clients</CardTitle>
              <CardDescription>Clients by total project value</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topClients.length > 0 ? (
                <div className="space-y-4">
                  {topClients.map((client: any, index: number) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-4 py-2 border-b last:border-0"
                      data-testid={`client-rank-${index + 1}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{client.businessLegalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.projectCount} project{client.projectCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="font-serif font-bold text-lg shrink-0">
                        ${parseFloat(client.totalValue || "0").toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No client data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Over Time */}
        <Card className="border-border/50" data-testid="card-revenue-chart">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue for the past year</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : revenueByMonth.length > 0 ? (
              <div className="h-64 flex items-end gap-2">
                {revenueByMonth.map((item: any, index: number) => {
                  const maxRevenue = Math.max(...revenueByMonth.map((r: any) => r.revenue));
                  const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div 
                        className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                        title={`$${item.revenue.toLocaleString()}`}
                      />
                      <span className="text-xs text-muted-foreground">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No revenue data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
