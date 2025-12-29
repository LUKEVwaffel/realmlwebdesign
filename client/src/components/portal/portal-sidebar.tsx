import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  Upload,
  Settings, 
  LogOut,
  Users,
  BarChart3,
  ChevronDown,
  ClipboardList,
  Receipt,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const clientNavItems = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
  { title: "Tutorial", url: "/client/tutorial", icon: HelpCircle },
  { title: "Questionnaire", url: "/client/questionnaire", icon: ClipboardList },
  { title: "Quotes", url: "/client/quotes", icon: Receipt },
  { title: "Payments", url: "/client/payments", icon: CreditCard },
  { title: "Documents", url: "/client/documents", icon: FileText },
  { title: "Uploads", url: "/client/uploads", icon: Upload },
  { title: "Settings", url: "/client/settings", icon: Settings },
];

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Clients", url: "/admin/clients", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function PortalSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : clientNavItems;

  const handleLogout = () => {
    logout();
    setLocation("/portal/login");
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <Link href="/" className="flex flex-col items-center justify-center gap-1">
          <div className="relative">
            <span 
              className="text-4xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DUO
            </span>
            <div 
              className="absolute -inset-2 opacity-30 blur-lg rounded-full -z-10"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
              }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/50 font-medium">
            Client Portal
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {isAdmin ? "Administration" : "Your Project"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 w-full p-2 rounded-lg hover-elevate"
              data-testid="button-user-menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link
                href={isAdmin ? "/admin/settings" : "/client/settings"}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
