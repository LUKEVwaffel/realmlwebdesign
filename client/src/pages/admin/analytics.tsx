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
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal/portal-layout";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const statusColors: Record<string, string> = {
  pending_payment: "#eab308",
  in_progress: "#3b82f6",
  design_review: "#a855f7",
  development: "#06b6d4",
  client_review: "#f97316",
  revisions: "#ec4899",
  completed: "#22c55e",
  on_hold: "#6b7280",
  cancelled: "#ef4444",
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

const projectTypeLabels: Record<string, string> = {
  new_website: "New Website",
  redesign: "Redesign",
  landing_page: "Landing Page",
  ecommerce: "E-Commerce",
  other: "Other",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ec4899", "#eab308"];

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
  const clientAcquisition = analyticsData?.clientAcquisition || [];
  const projectMetrics = analyticsData?.projectMetrics || { projectsByType: [] };
  const topClients = analyticsData?.topClients || [];

  const formattedRevenueData = [...revenueByMonth]
    .reverse()
    .slice(-12)
    .map((item: any) => ({
      month: item.month?.substring(5) || item.month,
      revenue: parseFloat(item.revenue) || 0,
    }));

  const formattedClientData = [...clientAcquisition]
    .reverse()
    .slice(-12)
    .map((item: any) => ({
      month: item.month?.substring(5) || item.month,
      clients: parseInt(item.count) || 0,
    }));

  const formattedProjectTypeData = (projectMetrics.projectsByType || []).map((item: any) => ({
    name: projectTypeLabels[item.type] || item.type,
    value: parseInt(item.count) || 0,
  }));

  const projectTypeTotal = formattedProjectTypeData.reduce((sum: number, item: any) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md p-2 shadow-md">
          <p className="text-foreground text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: {typeof entry.value === 'number' && entry.name === 'Revenue' 
                ? `$${entry.value.toLocaleString()}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formattedStatusData = projectsByStatus.map((item: any) => ({
    name: statusLabels[item.status] || item.status,
    value: parseInt(item.count) || 0,
    fill: statusColors[item.status] || "#6b7280",
  }));

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

        {/* Revenue Over Time Chart */}
        <Card className="border-border/50" data-testid="card-revenue-chart">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue for the past year</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : formattedRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={formattedRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No revenue data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Acquisition Trends */}
          <Card className="border-border/50" data-testid="card-client-acquisition">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Client Acquisition</CardTitle>
              <CardDescription>New clients added each month</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : formattedClientData.length > 0 ? (
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={formattedClientData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, "New Clients"]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clients" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No client data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects by Type */}
          <Card className="border-border/50" data-testid="card-projects-by-type">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Projects by Type</CardTitle>
              <CardDescription>Distribution of project categories</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : formattedProjectTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={256}>
                  <PieChart>
                    <Pie
                      data={formattedProjectTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {formattedProjectTypeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, "Projects"]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No project data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects by Status */}
          <Card className="border-border/50" data-testid="card-projects-by-status">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Projects by Status</CardTitle>
              <CardDescription>Current project status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : formattedStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart 
                    data={formattedStatusData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      width={90}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, "Projects"]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {formattedStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No project data yet</p>
                  </div>
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
      </div>
    </PortalLayout>
  );
}
