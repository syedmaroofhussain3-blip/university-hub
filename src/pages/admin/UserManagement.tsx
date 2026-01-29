import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, Crown, Loader2, UserMinus, Users, Shield } from 'lucide-react';
import { FadeInUp } from '@/components/ui/motion';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  department: string | null;
  student_id: string | null;
  role: 'admin' | 'president' | 'student';
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [promotingUser, setPromotingUser] = useState<UserWithRole | null>(null);
  const [demotingUser, setDemotingUser] = useState<UserWithRole | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      // Fetch all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          department: profile.department,
          student_id: profile.student_id,
          role: (userRole?.role as 'admin' | 'president' | 'student') || 'student'
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function promoteToPresident() {
    if (!promotingUser) return;
    
    setIsPromoting(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'president' })
        .eq('user_id', promotingUser.user_id);

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => 
          u.user_id === promotingUser.user_id 
            ? { ...u, role: 'president' } 
            : u
        )
      );

      toast({
        title: 'User promoted!',
        description: `${promotingUser.full_name || 'User'} is now a Club President.`
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to promote user.'
      });
    } finally {
      setIsPromoting(false);
      setPromotingUser(null);
    }
  }

  async function demoteToStudent() {
    if (!demotingUser) return;
    
    setIsDemoting(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'student' })
        .eq('user_id', demotingUser.user_id);

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => 
          u.user_id === demotingUser.user_id 
            ? { ...u, role: 'student' } 
            : u
        )
      );

      toast({
        title: 'President removed',
        description: `${demotingUser.full_name || 'User'} is now a Student.`
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to demote user.'
      });
    } finally {
      setIsDemoting(false);
      setDemotingUser(null);
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-aurora-violet/20 text-aurora-violet border-0">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'president':
        return (
          <Badge className="bg-aurora-cyan/20 text-aurora-cyan border-0">
            <Crown className="h-3 w-3 mr-1" />
            President
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="glass border-white/10">
            Student
          </Badge>
        );
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-10 w-64 bg-white/5" />
        <Skeleton className="h-64 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl aurora-gradient">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and promote students to Club Presidents
            </p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass border-white/10 focus:border-aurora-cyan/50"
          />
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Student ID</TableHead>
                <TableHead className="text-muted-foreground">Department</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No users match your search.' : 'No users found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium">
                      {user.full_name || 'Not set'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.student_id || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{user.department || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {user.role === 'student' && (
                        <motion.span whileTap={{ scale: 0.95 }} className="inline-block">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPromotingUser(user)}
                            className="gap-1 glass border-white/10 hover:bg-aurora-cyan/20 hover:text-aurora-cyan hover:border-aurora-cyan/50"
                          >
                            <Crown className="h-4 w-4" />
                            Make President
                          </Button>
                        </motion.span>
                      )}
                      {user.role === 'president' && (
                        <motion.span whileTap={{ scale: 0.95 }} className="inline-block">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDemotingUser(user)}
                            className="gap-1 glass border-white/10 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50"
                          >
                            <UserMinus className="h-4 w-4" />
                            Remove President
                          </Button>
                        </motion.span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </FadeInUp>

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={!!promotingUser} onOpenChange={() => setPromotingUser(null)}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Promote to Club President?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to promote <strong className="text-aurora-cyan">{promotingUser?.full_name || 'this user'}</strong> to 
              Club President. They will be able to create events, manage registrations, and post 
              announcements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPromoting} className="glass border-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={promoteToPresident}
              disabled={isPromoting}
              className="aurora-gradient border-0"
            >
              {isPromoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote Confirmation Dialog */}
      <AlertDialog open={!!demotingUser} onOpenChange={() => setDemotingUser(null)}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remove President Role?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to demote <strong className="text-destructive">{demotingUser?.full_name || 'this user'}</strong> back 
              to Student. They will lose access to event management and announcement features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDemoting} className="glass border-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={demoteToStudent}
              disabled={isDemoting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDemoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove President
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
