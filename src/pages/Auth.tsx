import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { signIn, signUp, getRoleFromEmail } from '@/lib/auth';
import { GraduationCap, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">University Event Hub</CardTitle>
          <CardDescription>
            Sign in to manage and participate in campus events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {activeTab === 'signup' && detectedRole && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <span className="text-muted-foreground">Detected role: </span>
                    <span className="font-medium capitalize text-primary">
                      {detectedRole === 'admin' ? 'Faculty Admin' : 'Student'}
                    </span>
                  </div>
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
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TabsContent value="signin" className="mt-0">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </TabsContent>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {activeTab === 'signup' ? (
                <>
                  Use your <span className="font-medium">@iul.ac.in</span> email for admin access
                  or <span className="font-medium">@student.iul.ac.in</span> for student access.
                </>
              ) : (
                'Enter your credentials to access your account.'
              )}
            </p>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
