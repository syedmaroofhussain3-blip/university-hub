import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Users, UserPlus, Copy, Check } from 'lucide-react';

interface TeamRegistrationProps {
  eventId: string;
  userId: string;
  minTeamSize: number;
  maxTeamSize: number | null;
  onSuccess: () => void;
}

export default function TeamRegistration({
  eventId,
  userId,
  minTeamSize,
  maxTeamSize,
  onSuccess
}: TeamRegistrationProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<{ name: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreateTeam() {
    if (!teamName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Team name required',
        description: 'Please enter a name for your team.'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate team code using database function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_team_code');

      if (codeError) throw codeError;

      const teamCode = codeData;

      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          event_id: eventId,
          name: teamName.trim(),
          team_code: teamCode,
          leader_id: userId
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add leader as first team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: userId
        });

      if (memberError) throw memberError;

      // Create registration for the leader
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'pending'
        });

      if (regError) throw regError;

      setCreatedTeam({ name: teamName, code: teamCode });

      toast({
        title: 'Team created!',
        description: 'Share the code with your team members.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating team',
        description: error.message || 'Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinTeam() {
    if (!joinCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Code required',
        description: 'Please enter the team code.'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find team by code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*, team_members(count)')
        .eq('team_code', joinCode.toUpperCase().trim())
        .eq('event_id', eventId)
        .single();

      if (teamError || !team) {
        throw new Error('Team not found. Please check the code and try again.');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingMember) {
        throw new Error('You are already a member of this team.');
      }

      // Check team size limit
      const memberCount = (team.team_members as any)?.[0]?.count || 0;
      if (maxTeamSize && memberCount >= maxTeamSize) {
        throw new Error(`This team is full (maximum ${maxTeamSize} members).`);
      }

      // Join team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId
        });

      if (memberError) throw memberError;

      // Create registration
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'pending'
        });

      if (regError) throw regError;

      toast({
        title: 'Joined team!',
        description: `You have joined "${team.name}".`
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error joining team',
        description: error.message || 'Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }

  function copyCode() {
    if (createdTeam) {
      navigator.clipboard.writeText(createdTeam.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Code copied!' });
    }
  }

  if (createdTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Created!
          </CardTitle>
          <CardDescription>
            Share this code with your team members so they can join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Team Name</p>
            <p className="font-semibold text-lg">{createdTeam.name}</p>
          </div>
          
          <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Team Code</p>
            <p className="font-mono text-3xl font-bold tracking-widest text-primary">
              {createdTeam.code}
            </p>
          </div>

          <Button onClick={copyCode} variant="outline" className="w-full gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Team size: {minTeamSize} - {maxTeamSize || '∞'} members
          </p>

          <Button onClick={onSuccess} className="w-full">
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Registration</CardTitle>
        <CardDescription>
          Create a new team or join an existing one with a team code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'join')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="gap-2">
              <Users className="h-4 w-4" />
              Create Team
            </TabsTrigger>
            <TabsTrigger value="join" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Join Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Code Warriors"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Team size: {minTeamSize} - {maxTeamSize || '∞'} members
            </p>
            <Button 
              onClick={handleCreateTeam} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Team...
                </>
              ) : (
                'Create Team & Get Code'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Team Code</Label>
              <Input
                id="join-code"
                placeholder="e.g., ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the 6-character code shared by your team leader
            </p>
            <Button 
              onClick={handleJoinTeam} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Team...
                </>
              ) : (
                'Join Team'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
