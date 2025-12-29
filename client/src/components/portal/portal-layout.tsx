import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PortalSidebar } from "./portal-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { DuoLogoSpinner } from "@/components/duo-logo-spinner";

interface PortalLayoutProps {
  children: ReactNode;
  requiredRole?: "admin" | "client";
}

export function PortalLayout({ children, requiredRole }: PortalLayoutProps) {
  const { user, isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <DuoLogoSpinner size="md" />
      </div>
    );
  }

  if (!token || !user) {
    return <Redirect to="/portal/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const redirectPath = user.role === "admin" ? "/admin/dashboard" : "/client/dashboard";
    return <Redirect to={redirectPath} />;
  }

  if (user.mustChangePassword) {
    return <Redirect to="/portal/change-password" />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <PortalSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b border-border shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
