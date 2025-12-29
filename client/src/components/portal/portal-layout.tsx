import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PortalSidebar } from "./portal-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { Redirect, useLocation } from "wouter";
import { DuoLogoSpinner } from "@/components/duo-logo-spinner";

interface PortalLayoutProps {
  children: ReactNode;
  requiredRole?: "admin" | "client";
}

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: { 
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2
    }
  }
};

export function PortalLayout({ children, requiredRole }: PortalLayoutProps) {
  const { user, isLoading, token } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <DuoLogoSpinner size="md" />
      </motion.div>
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
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                {...pageTransition}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
