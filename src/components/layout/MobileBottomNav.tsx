import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Home, Calendar, ClipboardList, User, PlusCircle, Settings, Users } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/registrations', icon: ClipboardList, label: 'My Events' },
];

const presidentItems = [
  { path: '/events/create', icon: PlusCircle, label: 'Create' },
  { path: '/events/manage', icon: Settings, label: 'Manage' },
];

const adminItems = [
  { path: '/admin/users', icon: Users, label: 'Users' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { role } = useAuth();
  
  const showPresidentItems = role === 'president' || role === 'admin';
  const showAdminItems = role === 'admin';
  
  // Build items based on role
  let items = [...navItems];
  if (showPresidentItems) {
    items = [...items, presidentItems[0]]; // Add create only for mobile
  }
  if (showAdminItems) {
    items = [...items, adminItems[0]];
  }
  
  // Limit to 5 items max for mobile
  items = items.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass border-t border-white/10 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 px-3 py-2"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'aurora-gradient text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 h-0.5 w-6 aurora-gradient rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
