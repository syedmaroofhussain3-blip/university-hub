import { Outlet, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { DesktopTopNav } from './DesktopTopNav';
import { MobileBottomNav } from './MobileBottomNav';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { user, isLoading, profileCompleted } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center cosmic-hero">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 aurora-gradient rounded-full blur-xl opacity-50 animate-pulse" />
            <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to complete profile if profile is not completed
  if (!profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  return (
    <div className="min-h-screen cosmic-bg">
      {/* Desktop Navigation */}
      <DesktopTopNav />
      
      {/* Main Content */}
      <main className="pt-0 pb-24 md:pt-20 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-6"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
