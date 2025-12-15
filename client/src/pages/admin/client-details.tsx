import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
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
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalLayout } from "@/components/portal/portal-layout";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  design_review: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  development: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  client_review: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  revisions: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_hold: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function ClientDetails() {
  const [, params] = useRoute("/admin/clients/:id");
  const clientId = params?.id;

  const { data: client, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/clients", clientId],
    enabled: !!clientId,
  });

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

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/admin/clients">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-client-name">
              {client.businessLegalName}
            </h1>
            <p className="text-muted-foreground">{client.industry || "No industry specified"}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.user && (
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium">{client.user.firstName} {client.user.lastName}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.businessEmail || client.user?.email}</span>
              </div>
              {client.businessPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{client.businessPhone}</span>
                </div>
              )}
              {client.existingWebsite && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href={client.existingWebsite} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                    {client.existingWebsite}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Client since {client.createdAt ? format(new Date(client.createdAt), "MMM d, yyyy") : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.projects?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.payments?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Payments</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.documents?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{client.messages?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList>
            <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Projects
                </CardTitle>
                <CardDescription>{client.projects?.length || 0} total projects</CardDescription>
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
                  <p className="text-muted-foreground text-center py-8">No projects yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payments
                </CardTitle>
                <CardDescription>{client.payments?.length || 0} total payments</CardDescription>
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
                        <div className="text-right">
                          <p className="font-medium">${payment.amount}</p>
                          <Badge className={paymentStatusColors[payment.status] || paymentStatusColors.pending}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No payments yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </CardTitle>
                <CardDescription>{client.documents?.length || 0} total documents</CardDescription>
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
                        {doc.requiresSignature && (
                          <Badge variant={doc.isSigned ? "default" : "secondary"}>
                            {doc.isSigned ? "Signed" : "Pending Signature"}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No documents yet</p>
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
        </Tabs>
      </div>
    </PortalLayout>
  );
}
