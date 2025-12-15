import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Portfolio from "@/pages/portfolio";
import About from "@/pages/about";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ChangePassword from "@/pages/change-password";

import ClientDashboard from "@/pages/client/dashboard";
import ClientPayments from "@/pages/client/payments";
import PaymentSuccess from "@/pages/client/payment-success";
import PaymentCancel from "@/pages/client/payment-cancel";
import ClientDocuments from "@/pages/client/documents";
import ClientMessages from "@/pages/client/messages";
import ClientSettings from "@/pages/client/settings";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminClients from "@/pages/admin/clients";
import AdminProjects from "@/pages/admin/projects";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/about" component={About} />
      
      {/* Auth Routes */}
      <Route path="/portal/login" component={Login} />
      <Route path="/portal/forgot-password" component={ForgotPassword} />
      <Route path="/portal/change-password" component={ChangePassword} />
      
      {/* Client Portal Routes */}
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/payments" component={ClientPayments} />
      <Route path="/client/payments/success" component={PaymentSuccess} />
      <Route path="/client/payments/cancel" component={PaymentCancel} />
      <Route path="/client/documents" component={ClientDocuments} />
      <Route path="/client/messages" component={ClientMessages} />
      <Route path="/client/settings" component={ClientSettings} />
      
      {/* Admin Portal Routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/clients" component={AdminClients} />
      <Route path="/admin/projects" component={AdminProjects} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/settings" component={AdminSettings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="web-design-theme">
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
