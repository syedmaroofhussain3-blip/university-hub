import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Users, UserPlus, Copy, Check, Upload, X } from 'lucide-react';

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
  }

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
      let logoUrl: string | null = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `teams/${eventId}/${teamCode}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          event_id: eventId,
          name: teamName.trim(),
          team_code: teamCode,
          leader_id: userId,
          logo_url: logoUrl
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

      // Create registration for the leader (pending for team events - needs admin approval)
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
        description: 'Share the code with your team members. Admin will approve once payment is verified.'
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

      // Create registration (pending for team events)
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
        description: `You have joined "${team.name}". Awaiting admin approval.`
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

          <p className="text-sm text-yellow-600 text-center bg-yellow-50 p-2 rounded">
            Your team registration is pending. Admin will approve after verifying payment.
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

            {/* Team Logo Upload */}
            <div className="space-y-2">
              <Label>Team Logo (Optional)</Label>
              {logoPreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={logoPreview} 
                    alt="Team logo" 
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex w-24 h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-1">Logo</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
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