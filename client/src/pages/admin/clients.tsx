import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Building2,
  Trash2,
  MapPin,
  Users,
  Globe
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalLayout } from "@/components/portal/portal-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";


export default function AdminClients() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newClient, setNewClient] = useState({
    businessLegalName: "",
    businessEmail: "",
    businessPhone: "",
    industry: "",
    firstName: "",
    lastName: "",
    email: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    existingWebsite: "",
    secondaryContactName: "",
    secondaryContactEmail: "",
    secondaryContactPhone: "",
    secondaryContactRelationship: "",
  });

  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newClient) => {
      const res = await apiRequest("POST", "/api/admin/clients", data);
      return res.json();
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
        addressStreet: "",
        addressCity: "",
        addressState: "",
        addressZip: "",
        existingWebsite: "",
        secondaryContactName: "",
        secondaryContactEmail: "",
        secondaryContactPhone: "",
        secondaryContactRelationship: "",
      });
      toast({
        title: "Client created",
        description: "New client has been added successfully.",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes(":") 
        ? error.message.split(":").slice(1).join(":").trim()
        : error.message;
      toast({
        title: "Failed to create client",
        description: errorMessage || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/clients/${clientId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setClientToDelete(null);
      toast({
        title: "Client deleted",
        description: "Client and all associated data have been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete client",
        description: error.message || "Please try again later.",
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
            <DialogContent className="max-w-2xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Enter the client's business and contact information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient}>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="basic" className="gap-2" data-testid="tab-basic">
                      <Building2 className="w-4 h-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="address" className="gap-2" data-testid="tab-address">
                      <MapPin className="w-4 h-4" />
                      Address
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="gap-2" data-testid="tab-contacts">
                      <Users className="w-4 h-4" />
                      Contacts
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[340px] pr-4">
                    <TabsContent value="basic" className="space-y-4 mt-0">
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
                      <div className="grid grid-cols-2 gap-4">
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
                            placeholder="e.g., Healthcare"
                            data-testid="input-industry"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="existingWebsite">Website URL</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="existingWebsite"
                            type="url"
                            value={newClient.existingWebsite}
                            onChange={(e) => setNewClient({ ...newClient, existingWebsite: e.target.value })}
                            placeholder="https://example.com"
                            className="pl-9"
                            data-testid="input-website"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="address" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="addressStreet">Street Address</Label>
                        <Input
                          id="addressStreet"
                          value={newClient.addressStreet}
                          onChange={(e) => setNewClient({ ...newClient, addressStreet: e.target.value })}
                          placeholder="123 Main St"
                          data-testid="input-street"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="addressCity">City</Label>
                          <Input
                            id="addressCity"
                            value={newClient.addressCity}
                            onChange={(e) => setNewClient({ ...newClient, addressCity: e.target.value })}
                            data-testid="input-city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addressState">State</Label>
                          <Input
                            id="addressState"
                            value={newClient.addressState}
                            onChange={(e) => setNewClient({ ...newClient, addressState: e.target.value })}
                            data-testid="input-state"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressZip">ZIP Code</Label>
                        <Input
                          id="addressZip"
                          value={newClient.addressZip}
                          onChange={(e) => setNewClient({ ...newClient, addressZip: e.target.value })}
                          data-testid="input-zip"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="contacts" className="space-y-4 mt-0">
                      <p className="text-sm text-muted-foreground">
                        Add a secondary contact for this client (optional)
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryContactName">Full Name</Label>
                        <Input
                          id="secondaryContactName"
                          value={newClient.secondaryContactName}
                          onChange={(e) => setNewClient({ ...newClient, secondaryContactName: e.target.value })}
                          placeholder="Jane Smith"
                          data-testid="input-secondary-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryContactRelationship">Role / Relationship</Label>
                        <Input
                          id="secondaryContactRelationship"
                          value={newClient.secondaryContactRelationship}
                          onChange={(e) => setNewClient({ ...newClient, secondaryContactRelationship: e.target.value })}
                          placeholder="e.g., Marketing Manager"
                          data-testid="input-secondary-relationship"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryContactEmail">Email</Label>
                        <Input
                          id="secondaryContactEmail"
                          type="email"
                          value={newClient.secondaryContactEmail}
                          onChange={(e) => setNewClient({ ...newClient, secondaryContactEmail: e.target.value })}
                          data-testid="input-secondary-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryContactPhone">Phone</Label>
                        <Input
                          id="secondaryContactPhone"
                          value={newClient.secondaryContactPhone}
                          onChange={(e) => setNewClient({ ...newClient, secondaryContactPhone: e.target.value })}
                          data-testid="input-secondary-phone"
                        />
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
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
                      <TableHead className="hidden lg:table-cell">Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client: any) => (
                      <TableRow 
                        key={client.id} 
                        data-testid={`client-row-${client.id}`}
                        className="cursor-pointer hover-elevate"
                        onClick={() => window.location.href = `/admin/clients/${client.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate">{client.businessLegalName}</p>
                                {(client.status === "completed" || client.status === "cancelled") && (
                                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                                    Closed
                                  </Badge>
                                )}
                              </div>
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
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {client.createdAt ? format(new Date(client.createdAt), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientToDelete({ 
                                id: client.id, 
                                name: client.businessLegalName 
                              });
                            }}
                            data-testid={`button-delete-client-${client.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to delete "{clientToDelete?.name}"? This action cannot be undone and will permanently remove:
                <ul className="list-disc ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>All project data</li>
                  <li>All payment records</li>
                  <li>All documents and uploads</li>
                  <li>All messages and activity history</li>
                  <li>The client's user account</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && deleteMutation.mutate(clientToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}
