import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import {
  GraduationCap,
  Home,
  Calendar,
  ClipboardList,
  PlusCircle,
  Users,
  Megaphone,
  Settings,
  LogOut,
  LayoutDashboard,
  UserCog
} from 'lucide-react';

export function AppSidebar() {
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed out successfully' });
      navigate('/');
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error signing out' 
      });
    }
  };

  // Base items for all authenticated users
  const studentItems = [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Browse Events', url: '/events', icon: Calendar },
    { title: 'My Registrations', url: '/registrations', icon: ClipboardList },
  ];

  // President/Admin items for event management
  const presidentItems = [
    { title: 'Create Event', url: '/events/create', icon: PlusCircle },
    { title: 'Manage Events', url: '/events/manage', icon: Settings },
    { title: 'Post Announcement', url: '/announcements/create', icon: Megaphone },
  ];

  // Admin-only items
  const adminItems = [
    { title: 'User Management', url: '/admin/users', icon: UserCog },
    { title: 'Admin Dashboard', url: '/admin', icon: LayoutDashboard },
  ];

  const showPresidentItems = role === 'president' || role === 'admin';
  const showAdminItems = role === 'admin';

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold">IUL Event Hub</span>
            {role && (
              <p className="text-xs text-muted-foreground capitalize">
                {role === 'admin' ? 'Faculty Admin' : role === 'president' ? 'Club President' : 'Student'}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showPresidentItems && (
          <SidebarGroup>
            <SidebarGroupLabel>Event Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {presidentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showAdminItems && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground truncate">
            {user?.email}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
