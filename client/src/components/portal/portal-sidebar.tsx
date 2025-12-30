import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  HelpCircle,
  MessageCircle,
  FileCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
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
  { title: "Quotes", url: "/client/quotes", icon: FileCheck },
  { title: "Messages", url: "/client/messages", icon: MessageCircle },
  { title: "Tutorial", url: "/client/tutorial", icon: HelpCircle },
  { title: "Questionnaire", url: "/client/questionnaire", icon: ClipboardList },
  { title: "Uploads", url: "/client/uploads", icon: Upload },
];

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Clients", url: "/admin/clients", icon: Users },
  { title: "Messages", url: "/admin/messages", icon: MessageCircle },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function PortalSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : clientNavItems;

  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/client/messages/unread"],
    enabled: !isAdmin,
    refetchInterval: 10000,
  });

  const { data: adminUnreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/admin/messages/unread-total"],
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  const { data: quotes } = useQuery<any[]>({
    queryKey: ["/api/client/quotes"],
    enabled: !isAdmin,
    refetchInterval: 30000,
  });

  const pendingQuotesCount = (quotes || []).filter(
    (q: any) => q.status === "sent" || q.status === "viewed"
  ).length;

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
              {navItems.map((item) => {
                let badgeCount = 0;
                if (item.title === "Messages") {
                  badgeCount = isAdmin ? adminUnreadData?.unreadCount || 0 : unreadData?.unreadCount || 0;
                } else if (item.title === "Quotes" && !isAdmin) {
                  badgeCount = pendingQuotesCount;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url || location.startsWith(item.url + "/")}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge 
                            variant={item.title === "Quotes" ? "default" : "destructive"}
                            className="ml-auto text-[10px] px-1.5 min-w-[18px] h-[18px] flex items-center justify-center"
                            data-testid={`badge-${item.title.toLowerCase()}-count`}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
