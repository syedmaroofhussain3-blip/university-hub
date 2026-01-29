import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap,
  Home,
  Calendar,
  ClipboardList,
  PlusCircle,
  Settings,
  Megaphone,
  LogOut,
  LayoutDashboard,
  UserCog,
  ChevronDown,
  User,
} from 'lucide-react';

const navLinks = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/registrations', icon: ClipboardList, label: 'My Registrations' },
];

const presidentLinks = [
  { path: '/events/create', icon: PlusCircle, label: 'Create Event' },
  { path: '/events/manage', icon: Settings, label: 'Manage Events' },
  { path: '/announcements/create', icon: Megaphone, label: 'Post Announcement' },
];

const adminLinks = [
  { path: '/admin/users', icon: UserCog, label: 'User Management' },
  { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
];

export function DesktopTopNav() {
  const location = useLocation();
  const { role, user } = useAuth();
  
  const showPresidentLinks = role === 'president' || role === 'admin';
  const showAdminLinks = role === 'admin';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed out successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error signing out' });
    }
  };

  const roleLabel = role === 'admin' 
    ? 'Faculty Admin' 
    : role === 'president' 
    ? 'Club President' 
    : 'Student';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 hidden md:block">
      <div className="glass border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl aurora-gradient"
            >
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <div>
              <span className="font-display text-lg font-bold">IUL Event Hub</span>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </Link>

          {/* Main Nav */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              
              return (
                <Link key={link.path} to={link.path}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-foreground'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </motion.div>
                </Link>
              );
            })}

            {/* President Dropdown */}
            {showPresidentLinks && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Manage
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card w-56">
                  <DropdownMenuLabel>Event Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {presidentLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem key={link.path} asChild>
                        <Link to={link.path} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Admin Dropdown */}
            {showAdminLinks && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <UserCog className="h-4 w-4" />
                    Admin
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card w-56">
                  <DropdownMenuLabel>Administration</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {adminLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem key={link.path} asChild>
                        <Link to={link.path} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <User className="h-4 w-4" />
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{roleLabel}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
