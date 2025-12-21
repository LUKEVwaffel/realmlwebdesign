import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { 
  Users, 
  FolderKanban, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowLeft,
  AlertCircle,
  Target,
  Percent,
  Receipt,
  UserPlus,
  PauseCircle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  AreaChart,
  Area,
} from "recharts";

const statusColors: Record<string, string> = {
  created: "#6b7280",
  questionnaire_pending: "#eab308",
  questionnaire_complete: "#22c55e",
  tos_pending: "#f97316",
  tos_signed: "#22c55e",
  design_pending: "#a855f7",
  design_approved: "#22c55e",
  in_development: "#3b82f6",
  hosting_setup: "#06b6d4",
  deployed: "#22c55e",
  delivery: "#ec4899",
  client_review: "#f97316",
  completed: "#22c55e",
  on_hold: "#6b7280",
  cancelled: "#ef4444",
};

const statusLabels: Record<string, string> = {
  created: "Created",
  questionnaire_pending: "Questionnaire Pending",
  questionnaire_complete: "Questionnaire Complete",
  tos_pending: "TOS Pending",
  tos_signed: "TOS Signed",
  design_pending: "Design Pending",
  design_approved: "Design Approved",
  in_development: "In Development",
  hosting_setup: "Hosting Setup",
  deployed: "Deployed",
  delivery: "Delivery",
  client_review: "Client Review",
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

const sourceLabels: Record<string, string> = {
  referral: "Referral",
  cold_call: "Cold Call",
  social_media: "Social Media",
  previous_client: "Previous Client",
  networking: "Networking",
  other: "Other",
  unknown: "Unknown",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ec4899", "#eab308"];

export default function AdminAnalyticsPage() {
  const { adminId } = useParams<{ adminId: string }>();

  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics", adminId],
    enabled: !!adminId,
  });

  const { data: clientsData } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const admin = analyticsData?.admin || { id: "", name: "", email: "" };
  const stats = analyticsData?.stats || {
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
    averageProjectValue: 0,
    completionRate: 0,
    cancelledProjects: 0,
    onHoldProjects: 0,
  };

  const projectsByStatus = analyticsData?.projectsByStatus || [];
  const projectsByType = analyticsData?.projectsByType || [];
  const revenueByMonth = analyticsData?.revenueByMonth || [];
  const clientAcquisition = analyticsData?.clientAcquisition || [];
  const quoteMetrics = analyticsData?.quoteMetrics || {
    total: 0,
    draft: 0,
    sent: 0,
    approved: 0,
    rejected: 0,
    totalValue: 0,
    conversionRate: 0,
  };
  const clientSources = analyticsData?.clientSources || [];
  const topClients = analyticsData?.topClients || [];
  const activeProjectsList = analyticsData?.activeProjectsList || [];
  const pendingPaymentsList = analyticsData?.pendingPaymentsList || [];

  const formattedRevenueData = revenueByMonth.map((item: any) => ({
    month: item.month?.substring(5) || item.month,
    revenue: parseFloat(item.revenue) || 0,
  }));

  const formattedClientData = clientAcquisition.map((item: any) => ({
    month: item.month?.substring(5) || item.month,
    clients: parseInt(item.count) || 0,
  }));

  const formattedProjectTypeData = projectsByType.map((item: any) => ({
    name: projectTypeLabels[item.type] || item.type,
    value: parseInt(item.count) || 0,
  }));

  const formattedStatusData = projectsByStatus.map((item: any) => ({
    name: statusLabels[item.status] || item.status,
    value: parseInt(item.count) || 0,
    fill: statusColors[item.status] || "#6b7280",
  }));

  const formattedSourceData = clientSources.map((item: any) => ({
    name: sourceLabels[item.source] || item.source,
    value: item.count as number,
  }));

  const getClientName = (clientId: string) => {
    const client = (clientsData || []).find((c: any) => c.id === clientId);
    return client?.businessLegalName || "Unknown Client";
  };

  const metricCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      description: `$${stats.pendingRevenue.toLocaleString()} pending`,
    },
    {
      title: "Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      description: "Assigned clients",
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
      title: "Quote Conversion",
      value: `${quoteMetrics.conversionRate}%`,
      icon: Target,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
      description: `${quoteMetrics.approved} approved`,
    },
  ];

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm" className="mb-2" data-testid="button-back-analytics">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Overview
              </Button>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              {isLoading ? <Skeleton className="h-8 w-48" /> : `${admin.name}'s Analytics`}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? <Skeleton className="h-4 w-32" /> : admin.email}
            </p>
          </div>
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

        {/* Performance Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Percent className="w-6 h-6 mx-auto mb-1 text-orange-600" />
              <p className="text-2xl font-bold">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold">${Math.round(stats.averageProjectValue).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Avg Project Value</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold">{stats.completedProjects}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <PauseCircle className="w-6 h-6 mx-auto mb-1 text-gray-500" />
              <p className="text-2xl font-bold">{stats.onHoldProjects}</p>
              <p className="text-xs text-muted-foreground">On Hold</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
              <p className="text-2xl font-bold">{stats.cancelledProjects}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Quote & Payment Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quote Metrics */}
          <Card className="border-border/50" data-testid="card-quote-metrics">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quote Performance
              </CardTitle>
              <CardDescription>Your quote conversion stats</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-3xl font-bold text-green-600">${quoteMetrics.totalValue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Approved Value</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-3xl font-bold">{quoteMetrics.conversionRate}%</p>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-lg bg-muted/20">
                      <p className="text-xl font-bold">{quoteMetrics.draft}</p>
                      <p className="text-xs text-muted-foreground">Draft</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <p className="text-xl font-bold text-blue-600">{quoteMetrics.sent}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <p className="text-xl font-bold text-green-600">{quoteMetrics.approved}</p>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10">
                      <p className="text-xl font-bold text-red-600">{quoteMetrics.rejected}</p>
                      <p className="text-xs text-muted-foreground">Rejected</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className="border-border/50" data-testid="card-payment-status">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payment Overview
              </CardTitle>
              <CardDescription>Outstanding and collected payments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 text-center">
                      <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-600" />
                      <p className="text-xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Collected</p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                      <Clock className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
                      <p className="text-xl font-bold text-yellow-600">${stats.pendingRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 text-center">
                      <AlertCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                      <p className="text-xl font-bold text-red-600">${stats.overdueRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Collection Progress</span>
                      <span className="font-medium">
                        {stats.totalRevenue + stats.pendingRevenue > 0
                          ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.pendingRevenue)) * 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stats.totalRevenue + stats.pendingRevenue > 0
                        ? (stats.totalRevenue / (stats.totalRevenue + stats.pendingRevenue)) * 100
                        : 0} 
                      className="h-3" 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
            ) : formattedRevenueData.some((d: any) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={formattedRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue2)"
                  />
                </AreaChart>
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
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Client Acquisition
              </CardTitle>
              <CardDescription>New clients added each month</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : formattedClientData.some((d: any) => d.clients > 0) ? (
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

          {/* Client Sources */}
          <Card className="border-border/50" data-testid="card-client-sources">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Client Sources</CardTitle>
              <CardDescription>How your clients found you</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : formattedSourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={256}>
                  <PieChart>
                    <Pie
                      data={formattedSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {formattedSourceData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, "Clients"]}
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
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No source data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>

        {/* Active Projects & Pending Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Projects List */}
          <Card className="border-border/50" data-testid="card-active-projects">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                Active Projects
              </CardTitle>
              <CardDescription>Projects currently in progress</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : activeProjectsList.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activeProjectsList.map((project: any) => (
                    <div 
                      key={project.id} 
                      className="p-3 rounded-lg bg-muted/30 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getClientName(project.clientId)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {statusLabels[project.status] || project.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {project.progressPercentage}% complete
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">${parseFloat(project.totalCost || "0").toLocaleString()}</p>
                        <Link href={`/admin/clients/${project.clientId}`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No active projects</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="border-border/50" data-testid="card-pending-payments">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pending Payments
              </CardTitle>
              <CardDescription>Payments awaiting collection</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pendingPaymentsList.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {pendingPaymentsList.map((payment: any) => (
                    <div 
                      key={payment.id} 
                      className="p-3 rounded-lg bg-muted/30 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getClientName(payment.clientId)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={payment.status === "overdue" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {payment.status === "overdue" ? "Overdue" : "Pending"}
                          </Badge>
                          {payment.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold ${payment.status === "overdue" ? "text-red-600" : "text-yellow-600"}`}>
                          ${parseFloat(payment.amount || "0").toLocaleString()}
                        </p>
                        <Link href={`/admin/clients/${payment.clientId}`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
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

        {/* Top Clients */}
        <Card className="border-border/50" data-testid="card-top-clients">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Top Clients</CardTitle>
            <CardDescription>Your highest value clients</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : topClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topClients.map((client: any, index: number) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30"
                    data-testid={`client-rank-${index + 1}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                      index === 1 ? 'bg-gray-400/20 text-gray-500' :
                      index === 2 ? 'bg-amber-600/20 text-amber-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.businessLegalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.projectCount} project{client.projectCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="font-serif font-bold text-lg shrink-0 text-green-600 dark:text-green-400">
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
    </PortalLayout>
  );
}
