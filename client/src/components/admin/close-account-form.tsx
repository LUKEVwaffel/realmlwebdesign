import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CloseAccountFormProps {
  client: {
    id: string;
    contactName: string;
    email: string;
    phone?: string;
    businessName: string;
    projects?: Array<{
      projectType: string;
      totalCost: string;
      startDate?: string;
      targetCompletionDate?: string;
    }>;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CloseAccountForm({ client, onSuccess, onCancel }: CloseAccountFormProps) {
  const { toast } = useToast();
  const project = client.projects?.[0];
  
  const [formData, setFormData] = useState({
    clientName: client.contactName || '',
    email: client.email || '',
    phone: client.phone || '',
    businessName: client.businessName || '',
    projectType: project?.projectType || '',
    budget: project?.totalCost ? `$${project.totalCost}` : '',
    timeline: project?.startDate && project?.targetCompletionDate 
      ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.targetCompletionDate).toLocaleDateString()}`
      : '',
    reasonForClosing: '',
    finalNotes: '',
    accountStatus: 'closed'
  });

  const [submitted, setSubmitted] = useState(false);

  const closeAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", `/api/admin/clients/${client.id}/close`, data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients", client.id] });
      toast({
        title: "Account Closed",
        description: "Client account has been successfully closed and archived.",
      });
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to close account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.reasonForClosing) {
      toast({
        title: "Required field missing",
        description: "Please select a reason for closing the account.",
        variant: "destructive",
      });
      return;
    }
    closeAccountMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative bg-primary/10 p-4 rounded-full inline-block">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold mb-2">Account Closed</h2>
          <p className="text-muted-foreground">
            Client account has been successfully closed and archived.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-destructive/10 p-2 rounded-lg">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Close Client Account</h3>
          <p className="text-sm text-muted-foreground">
            Complete this form to officially close and archive this client account
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-base font-semibold flex items-center gap-2 border-b border-border pb-2">
            <User className="h-4 w-4 text-primary" />
            Client Information
          </h4>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="John Doe"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                data-testid="input-close-client-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  data-testid="input-close-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-10"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  data-testid="input-close-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="businessName"
                  className="pl-10"
                  placeholder="Acme Corp"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  data-testid="input-close-business"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-base font-semibold flex items-center gap-2 border-b border-border pb-2">
            <FileText className="h-4 w-4 text-primary" />
            Project Details
          </h4>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type *</Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => handleChange('projectType', value)}
              >
                <SelectTrigger id="projectType" data-testid="select-close-project-type">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_website">Standard Website</SelectItem>
                  <SelectItem value="business_premium">Business/Premium</SelectItem>
                  <SelectItem value="premium_web_store">Premium Web Store</SelectItem>
                  <SelectItem value="landing_page">Landing Page</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Project Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  className="pl-10"
                  placeholder="$5,000"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  data-testid="input-close-budget"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Project Timeline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="timeline"
                  className="pl-10"
                  placeholder="Jan 2024 - Mar 2024"
                  value={formData.timeline}
                  onChange={(e) => handleChange('timeline', e.target.value)}
                  data-testid="input-close-timeline"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountStatus">Account Status *</Label>
              <Select
                value={formData.accountStatus}
                onValueChange={(value) => handleChange('accountStatus', value)}
              >
                <SelectTrigger id="accountStatus" data-testid="select-close-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closed">Closed - Completed</SelectItem>
                  <SelectItem value="cancelled">Closed - Cancelled</SelectItem>
                  <SelectItem value="archived">Closed - Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-base font-semibold flex items-center gap-2 border-b border-border pb-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Closure Details
          </h4>

          <div className="space-y-2">
            <Label htmlFor="reasonForClosing">Reason for Closing *</Label>
            <Select
              value={formData.reasonForClosing}
              onValueChange={(value) => handleChange('reasonForClosing', value)}
            >
              <SelectTrigger id="reasonForClosing" data-testid="select-close-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Project Completed Successfully</SelectItem>
                <SelectItem value="client-request">Client Request</SelectItem>
                <SelectItem value="budget">Budget Constraints</SelectItem>
                <SelectItem value="timeline">Timeline Issues</SelectItem>
                <SelectItem value="scope-change">Scope Change</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalNotes">Final Notes & Comments</Label>
            <Textarea
              id="finalNotes"
              placeholder="Add any final notes about the project, deliverables, or follow-up items..."
              className="min-h-[120px] resize-none"
              value={formData.finalNotes}
              onChange={(e) => handleChange('finalNotes', e.target.value)}
              data-testid="input-close-notes"
            />
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Warning: This action cannot be undone
              </p>
              <p className="text-xs text-muted-foreground">
                Closing this account will archive all client data and mark the project as complete. 
                Ensure all deliverables are finalized and final invoices are settled.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-testid="button-cancel-close"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleSubmit}
            disabled={closeAccountMutation.isPending}
            data-testid="button-confirm-close"
          >
            {closeAccountMutation.isPending ? "Closing Account..." : "Close Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
