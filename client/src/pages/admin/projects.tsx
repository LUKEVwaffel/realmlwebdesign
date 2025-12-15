import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Eye, 
  MoreHorizontal,
  FolderKanban,
  Calendar,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PortalLayout } from "@/components/portal/portal-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

const projectTypeLabels: Record<string, string> = {
  new_website: "New Website",
  redesign: "Redesign",
  landing_page: "Landing Page",
  ecommerce: "E-commerce",
  other: "Other",
};

export default function AdminProjects() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/admin/projects"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      return apiRequest(`/api/admin/projects/${projectId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({
        title: "Status updated",
        description: "Project status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update project status.",
        variant: "destructive",
      });
    },
  });

  const filteredProjects = projects.filter((project: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      project.client?.businessLegalName?.toLowerCase().includes(searchLower) ||
      project.projectType?.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all web design projects
            </p>
          </div>
          <Link href="/admin/projects/new">
            <Button className="gap-2" data-testid="button-new-project">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-lg">All Projects</CardTitle>
                <CardDescription>{filteredProjects.length} total projects</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-projects"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Value</TableHead>
                      <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project: any) => (
                      <TableRow key={project.id} data-testid={`project-row-${project.id}`}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {project.client?.businessLegalName || "Unknown Client"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {project.client?.industry || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {projectTypeLabels[project.projectType] || project.projectType}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={project.progressPercentage || 0} className="h-2 flex-1" />
                            <span className="text-sm text-muted-foreground w-10">
                              {project.progressPercentage || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={project.status}
                            onValueChange={(value) => 
                              updateStatusMutation.mutate({ projectId: project.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-36 h-8" data-testid={`select-status-${project.id}`}>
                              <Badge className={statusColors[project.status] || "bg-muted"}>
                                {statusLabels[project.status] || project.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="font-medium">
                            ${parseFloat(project.totalCost || "0").toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {project.expectedCompletionDate 
                            ? format(new Date(project.expectedCompletionDate), "MMM d, yyyy")
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${project.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/projects/${project.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="w-4 h-4 mr-2" />
                                Update Timeline
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Manage Payments
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" 
                    ? "No projects found matching your filters" 
                    : "No projects yet"
                  }
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Link href="/admin/projects/new">
                    <Button className="mt-4 gap-2" data-testid="button-create-first-project">
                      <Plus className="w-4 h-4" />
                      Create Your First Project
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
