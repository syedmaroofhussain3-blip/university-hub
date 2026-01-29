import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Loader2, User } from 'lucide-react';
import { FadeInUp } from '@/components/ui/motion';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  department: z.string().min(1, 'Please select a department'),
  year: z.string().min(1, 'Please select your year'),
  studentId: z.string().min(1, 'Student ID is required').max(20)
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const departments = [
  'Computer Science',
  'Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Arts & Humanities',
  'Science',
  'Law',
  'Medicine'
];

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Faculty'];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, refreshAuthState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      department: '',
      year: '',
      studentId: ''
    }
  });

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName,
          department: values.department,
          year: values.year,
          student_id: values.studentId,
          profile_completed: true
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile completed!',
        description: 'Welcome to the University Event Hub.'
      });

      await refreshAuthState();
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save profile. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen cosmic-hero flex items-center justify-center p-4">
      {/* Ambient glow effects */}
      <div className="fixed top-40 right-1/4 h-72 w-72 rounded-full bg-aurora-violet/20 blur-[100px]" />
      <div className="fixed bottom-20 left-1/4 h-96 w-96 rounded-full bg-aurora-cyan/15 blur-[120px]" />
      
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
              <User className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground">
              Tell us a bit about yourself to get started
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        className="glass border-white/10 focus:border-aurora-cyan/50"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student / Faculty ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="IUL2024001" 
                        className="glass border-white/10 focus:border-aurora-cyan/50"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass border-white/10">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-card border-white/10">
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass border-white/10">
                          <SelectValue placeholder="Select your year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-card border-white/10">
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full aurora-gradient border-0 font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Profile
                </Button>
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </FadeInUp>
    </div>
  );
}
