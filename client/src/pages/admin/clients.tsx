import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Eye, 
  Mail, 
  MoreHorizontal,
  Building2,
  Phone,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PortalLayout } from "@/components/portal/portal-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  normal: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  low: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function AdminClients() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    businessLegalName: "",
    businessEmail: "",
    businessPhone: "",
    industry: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/admin/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newClient) => {
      return apiRequest("/api/admin/clients", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setIsAddDialogOpen(false);
      setNewClient({
        businessLegalName: "",
        businessEmail: "",
        businessPhone: "",
        industry: "",
        firstName: "",
        lastName: "",
        email: "",
      });
      toast({
        title: "Client created",
        description: "New client has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create client",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients.filter((client: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.businessLegalName?.toLowerCase().includes(searchLower) ||
      client.businessEmail?.toLowerCase().includes(searchLower) ||
      client.industry?.toLowerCase().includes(searchLower) ||
      client.user?.firstName?.toLowerCase().includes(searchLower) ||
      client.user?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newClient);
  };

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              Clients
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your client relationships
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-client">
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Enter the client's business and contact information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessLegalName">Business Name *</Label>
                  <Input
                    id="businessLegalName"
                    value={newClient.businessLegalName}
                    onChange={(e) => setNewClient({ ...newClient, businessLegalName: e.target.value })}
                    required
                    data-testid="input-business-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Contact First Name *</Label>
                    <Input
                      id="firstName"
                      value={newClient.firstName}
                      onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Contact Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newClient.lastName}
                      onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    value={newClient.businessPhone}
                    onChange={(e) => setNewClient({ ...newClient, businessPhone: e.target.value })}
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                    placeholder="e.g., Healthcare, Technology"
                    data-testid="input-industry"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-client">
                    {createMutation.isPending ? "Creating..." : "Create Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-lg">All Clients</CardTitle>
                <CardDescription>{filteredClients.length} total clients</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-clients"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="hidden md:table-cell">Industry</TableHead>
                      <TableHead className="hidden sm:table-cell">Priority</TableHead>
                      <TableHead className="hidden lg:table-cell">Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client: any) => (
                      <TableRow key={client.id} data-testid={`client-row-${client.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{client.businessLegalName}</p>
                              {client.businessEmail && (
                                <p className="text-sm text-muted-foreground truncate">{client.businessEmail}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {client.user?.firstName} {client.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{client.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.industry || "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={priorityColors[client.priority] || priorityColors.normal}>
                            {client.priority || "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {client.createdAt ? format(new Date(client.createdAt), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${client.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/clients/${client.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="w-4 h-4 mr-2" />
                                Call Client
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
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No clients found matching your search" : "No clients yet"}
                </p>
                {!searchQuery && (
                  <Button 
                    className="mt-4 gap-2" 
                    onClick={() => setIsAddDialogOpen(true)}
                    data-testid="button-add-first-client"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Client
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
