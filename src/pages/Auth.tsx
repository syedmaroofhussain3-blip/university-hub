import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { signIn, signUp, getRoleFromEmail } from '@/lib/auth';
import { GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { FadeInUp } from '@/components/ui/motion';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const watchedEmail = form.watch('email');
  const detectedRole = watchedEmail ? getRoleFromEmail(watchedEmail) : null;

  async function onSubmit(values: AuthFormValues) {
    setIsLoading(true);
    try {
      if (activeTab === 'signup') {
        await signUp(values.email, values.password);
        toast({
          title: 'Account created!',
          description: 'Please complete your profile to continue.'
        });
        navigate('/complete-profile');
      } else {
        await signIn(values.email, values.password);
        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully.'
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email to confirm your account.';
      }

      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen cosmic-hero flex items-center justify-center p-4">
      {/* Ambient glow effects */}
      <div className="fixed top-20 left-1/4 h-72 w-72 rounded-full bg-aurora-cyan/20 blur-[100px]" />
      <div className="fixed bottom-20 right-1/4 h-96 w-96 rounded-full bg-aurora-magenta/15 blur-[120px]" />
      
      <FadeInUp>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md glass-card p-8"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl aurora-gradient"
            >
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold mb-2">Welcome to IUL Event Hub</h1>
            <p className="text-muted-foreground">
              Sign in to manage and participate in campus events
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 glass border-white/10">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:aurora-gradient data-[state=active]:text-primary-foreground"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:aurora-gradient data-[state=active]:text-primary-foreground"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your.email@iul.ac.in" 
                          type="email"
                          className="glass border-white/10 focus:border-aurora-cyan/50"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {activeTab === 'signup' && detectedRole && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass rounded-lg p-3 flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-aurora-cyan" />
                    <span className="text-sm text-muted-foreground">Detected role: </span>
                    <span className="text-sm font-medium text-aurora-cyan capitalize">
                      {detectedRole === 'admin' ? 'Faculty Admin' : 'Student'}
                    </span>
                  </motion.div>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password"
                          className="glass border-white/10 focus:border-aurora-cyan/50"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TabsContent value="signin" className="mt-0">
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit" 
                      className="w-full aurora-gradient border-0 font-semibold" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit" 
                      className="w-full aurora-gradient border-0 font-semibold" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </motion.div>
                </TabsContent>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {activeTab === 'signup' ? (
                <>
                  Use <span className="text-aurora-cyan font-medium">@iul.ac.in</span> for admin access
                  or <span className="text-aurora-cyan font-medium">@student.iul.ac.in</span> for student access.
                </>
              ) : (
                'Enter your credentials to access your account.'
              )}
            </p>
          </Tabs>
        </motion.div>
      </FadeInUp>
    </div>
  );
}
