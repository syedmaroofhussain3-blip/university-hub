import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Event } from '@/components/events/EventCard';
import { PlusCircle, Users, Check, X, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';

interface RegistrationWithProfile {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    department: string | null;
    student_id: string | null;
  } | null;
}

interface TeamWithMembers {
  id: string;
  name: string;
  team_code: string;
  logo_url: string | null;
  leader_id: string;
  created_at: string;
  members: {
    user_id: string;
    profiles: {
      full_name: string | null;
      student_id: string | null;
    } | null;
  }[];
  registrations: {
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

export default function ManageEvents() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState<(Event & { registrations_count: number; registration_type: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<(Event & { registration_type: string }) | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationWithProfile[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, role]);

  async function fetchEvents() {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      // Non-admins only see their own events
      if (role !== 'admin') {
        query = query.eq('created_by', user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch registration counts
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          return { ...event, registrations_count: count || 0 };
        })
      );

      setEvents(eventsWithCounts as (Event & { registrations_count: number; registration_type: string })[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function openParticipantSheet(event: Event & { registration_type: string }) {
    setSelectedEvent(event);
    setLoadingRegistrations(true);
    
    try {
      if (event.registration_type === 'team') {
        // Fetch teams with members for team events
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            team_code,
            logo_url,
            leader_id,
            created_at,
            team_members (
              user_id,
              profiles (
                full_name,
                student_id
              )
            )
          `)
          .eq('event_id', event.id)
          .order('created_at', { ascending: false });

        if (teamsError) throw teamsError;

        // Fetch registration status for each team's leader
        const teamsWithStatus = await Promise.all(
          (teamsData || []).map(async (team) => {
            const { data: regData } = await supabase
              .from('registrations')
              .select('status')
              .eq('event_id', event.id)
              .eq('user_id', team.leader_id)
              .maybeSingle();
            
            return {
              ...team,
              members: team.team_members as any,
              registrations: regData ? [regData as any] : [{ status: 'pending' }]
            };
          })
        );

        setTeams(teamsWithStatus);
        setRegistrations([]);
      } else {
        // Fetch individual registrations
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            id,
            status,
            created_at,
            user_id,
            profiles (
              full_name,
              department,
              student_id
            )
          `)
          .eq('event_id', event.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRegistrations(data as unknown as RegistrationWithProfile[]);
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoadingRegistrations(false);
    }
  }

  async function updateRegistrationStatus(regId: string, newStatus: 'approved' | 'rejected') {
    setUpdatingId(regId);
    
    // Optimistic update
    setRegistrations(prev => 
      prev.map(r => r.id === regId ? { ...r, status: newStatus } : r)
    );

    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', regId);

      if (error) throw error;

      toast({
        title: `Registration ${newStatus}`,
        description: `The participant has been ${newStatus}.`
      });
    } catch (error: any) {
      // Revert on error
      setRegistrations(prev => 
        prev.map(r => r.id === regId ? { ...r, status: 'pending' } : r)
      );
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update status.'
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateTeamStatus(teamId: string, leaderId: string, newStatus: 'approved' | 'rejected') {
    setUpdatingId(teamId);
    
    // Optimistic update
    setTeams(prev => 
      prev.map(t => t.id === teamId 
        ? { ...t, registrations: [{ status: newStatus }] } 
        : t
      )
    );

    try {
      // Get all team members
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (members && members.length > 0) {
        // Update all team members' registrations
        const { error } = await supabase
          .from('registrations')
          .update({ status: newStatus })
          .eq('event_id', selectedEvent!.id)
          .in('user_id', members.map(m => m.user_id));

        if (error) throw error;
      }

      toast({
        title: `Team ${newStatus}`,
        description: `All team members have been ${newStatus}.`
      });
    } catch (error: any) {
      // Revert on error
      setTeams(prev => 
        prev.map(t => t.id === teamId 
          ? { ...t, registrations: [{ status: 'pending' }] } 
          : t
        )
      );
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update team status.'
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({ title: 'Event deleted' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete event.'
      });
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Events</h1>
          <p className="text-muted-foreground">
            View and manage your events and registrations
          </p>
        </div>
        <Link to="/events/create">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any events yet.</p>
            <Link to="/events/create">
              <Button>Create Your First Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.club_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {event.registration_type === 'team' ? (
                        <><Users className="h-3 w-3" /> Team</>
                      ) : (
                        <><User className="h-3 w-3" /> Individual</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.event_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    {event.registrations_count} / {event.capacity}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openParticipantSheet(event)}
                      className="gap-1"
                    >
                      <Users className="h-4 w-4" />
                      {event.registration_type === 'team' ? 'Teams' : 'Participants'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteEvent(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Participant/Team Management Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedEvent?.registration_type === 'team' ? 'Manage Teams' : 'Manage Participants'}
            </SheetTitle>
            <SheetDescription>{selectedEvent?.title}</SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {loadingRegistrations ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : selectedEvent?.registration_type === 'team' ? (
              // Team View
              teams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No teams registered yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {teams.map((team) => {
                    const teamStatus = team.registrations[0]?.status || 'pending';
                    return (
                      <Card key={team.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={team.logo_url || undefined} />
                              <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="font-medium">{team.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    Code: {team.team_code}
                                  </p>
                                </div>
                                {getStatusBadge(teamStatus)}
                              </div>
                              
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {team.members.map((member, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="text-xs"
                                    >
                                      {member.profiles?.full_name || 'Unknown'}
                                      {member.user_id === team.leader_id && ' (Leader)'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {teamStatus === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    className="gap-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => updateTeamStatus(team.id, team.leader_id, 'approved')}
                                    disabled={updatingId === team.id}
                                  >
                                    {updatingId === team.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                    Approve Team
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="gap-1"
                                    onClick={() => updateTeamStatus(team.id, team.leader_id, 'rejected')}
                                    disabled={updatingId === team.id}
                                  >
                                    <X className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              // Individual Registrations View
              registrations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No registrations yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div 
                      key={reg.id} 
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {reg.profiles?.full_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{reg.profiles?.student_id}</span>
                          <span>•</span>
                          <span>{reg.profiles?.department}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {getStatusBadge(reg.status)}
                        {reg.status === 'pending' && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                              disabled={updatingId === reg.id}
                            >
                              {updatingId === reg.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                              disabled={updatingId === reg.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}