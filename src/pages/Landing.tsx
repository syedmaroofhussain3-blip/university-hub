import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FadeInUp, StaggerContainer, StaggerItem, FloatingCard } from '@/components/ui/motion';
import { GraduationCap, Calendar, Users, Bell, ArrowRight, Sparkles, Zap, Globe } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen cosmic-hero overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl aurora-gradient">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">IUL Event Hub</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="aurora-gradient border-0 font-semibold">
                  Get Started
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Ambient glow effects */}
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-aurora-cyan/20 blur-[100px]" />
        <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-aurora-magenta/15 blur-[120px]" />
        <div className="absolute bottom-20 left-1/2 h-64 w-64 rounded-full bg-aurora-violet/20 blur-[80px]" />
        
        <div className="container relative mx-auto px-4 text-center">
          <FadeInUp className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full glass-card px-4 py-2"
            >
              <Sparkles className="h-4 w-4 text-aurora-cyan" />
              <span className="text-sm text-muted-foreground">Experience the future of campus events</span>
            </motion.div>
            
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Experience Campus Life at{' '}
              <span className="text-gradient">Warp Speed</span>
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Discover workshops, hackathons, seminars, and competitions. 
              Register with one click and never miss a campus event again.
            </p>
            
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="aurora-gradient border-0 gap-2 px-8 font-semibold text-base">
                    Join as Student
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="outline" className="glass border-white/20 px-8 font-semibold text-base">
                    Organize Events
                  </Button>
                </motion.div>
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <FadeInUp className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              A complete platform for managing and participating in campus events
            </p>
          </FadeInUp>
          
          <StaggerContainer className="grid gap-6 md:grid-cols-3">
            <StaggerItem>
              <FloatingCard glowColor="cyan" className="p-6 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aurora-cyan/20">
                  <Zap className="h-6 w-6 text-aurora-cyan" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">One-Click Registration</h3>
                <p className="text-muted-foreground">
                  Browse all campus events and register instantly. 
                  Track your status in real-time.
                </p>
              </FloatingCard>
            </StaggerItem>

            <StaggerItem>
              <FloatingCard glowColor="magenta" className="p-6 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aurora-magenta/20">
                  <Users className="h-6 w-6 text-aurora-magenta" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Club Management</h3>
                <p className="text-muted-foreground">
                  Club presidents can create events, manage registrations, 
                  and approve participants effortlessly.
                </p>
              </FloatingCard>
            </StaggerItem>

            <StaggerItem>
              <FloatingCard glowColor="violet" className="p-6 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aurora-violet/20">
                  <Bell className="h-6 w-6 text-aurora-violet" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Stay Updated</h3>
                <p className="text-muted-foreground">
                  Receive announcements from event organizers. 
                  Never miss important updates.
                </p>
              </FloatingCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '50+', label: 'Events Monthly' },
              { value: '10K+', label: 'Active Students' },
              { value: '25+', label: 'Clubs & Societies' },
              { value: '100%', label: 'Free to Use' },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="glass-card p-6 text-center">
                  <div className="font-display text-3xl font-bold text-gradient md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <FadeInUp>
            <div className="glass-card aurora-border p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 aurora-gradient-subtle opacity-50" />
              <div className="relative">
                <Globe className="h-12 w-12 mx-auto mb-6 text-aurora-cyan" />
                <h2 className="font-display text-3xl font-bold md:text-4xl mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Sign up with your university email to access all features and join the campus community.
                </p>
                <Link to="/auth">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                    <Button size="lg" className="aurora-gradient border-0 px-8 font-semibold">
                      Create Your Account
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 IUL University Event Hub. Built for the campus community.</p>
        </div>
      </footer>
    </div>
  );
}
