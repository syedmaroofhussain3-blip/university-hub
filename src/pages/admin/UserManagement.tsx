import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Search, Crown, Loader2 } from 'lucide-react';

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
  const [isPromoting, setIsPromoting] = useState(false);

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
      // Update the user's role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'president' })
        .eq('user_id', promotingUser.user_id);

      if (error) throw error;

      // Update local state
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500">Admin</Badge>;
      case 'president':
        return <Badge className="bg-blue-500">President</Badge>;
      default:
        return <Badge variant="secondary">Student</Badge>;
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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and promote students to Club Presidents
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'Not set'}
                  </TableCell>
                  <TableCell>{user.student_id || '-'}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right">
                    {user.role === 'student' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPromotingUser(user)}
                        className="gap-1"
                      >
                        <Crown className="h-4 w-4" />
                        Make President
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={!!promotingUser} onOpenChange={() => setPromotingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Club President?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to promote <strong>{promotingUser?.full_name || 'this user'}</strong> to 
              Club President. They will be able to create events, manage registrations, and post 
              announcements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPromoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={promoteToPresident}
              disabled={isPromoting}
            >
              {isPromoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
