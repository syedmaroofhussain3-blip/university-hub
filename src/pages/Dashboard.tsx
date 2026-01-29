import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Users, ClipboardList, Megaphone, ArrowRight, Bell, Check, X, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalEvents: number;
  myRegistrations: number;
  myEvents: number;
  pendingApprovals: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface PendingTeam {
  id: string;
  name: string;
  team_code: string;
  logo_url: string | null;
  payment_receipt_url: string | null;
  leader_id: string;
  event_id: string;
  event_title: string;
  member_count: number;
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ 
    totalEvents: 0, 
    myRegistrations: 0, 
    myEvents: 0, 
    pendingApprovals: 0 
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Fetch total events
        const { count: eventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });

        // Fetch my registrations
        const { count: registrationsCount } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch my events (for presidents/admins)
        let myEventsCount = 0;
        let pendingCount = 0;
        const teamsList: PendingTeam[] = [];

        if (role === 'president' || role === 'admin') {
          const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id);
          myEventsCount = count || 0;

          // Fetch my events for getting pending teams
          let eventsQuery = supabase
            .from('events')
            .select('id, title, is_paid');

          if (role !== 'admin') {
            eventsQuery = eventsQuery.eq('created_by', user.id);
          }

          const { data: myEvents } = await eventsQuery;

          if (myEvents && myEvents.length > 0) {
            // Fetch pending teams with receipt for each event
            for (const event of myEvents) {
              const { data: teams } = await supabase
                .from('teams')
                .select(`
                  id,
                  name,
                  team_code,
                  logo_url,
                  payment_receipt_url,
                  leader_id,
                  event_id,
                  team_members (count)
                `)
                .eq('event_id', event.id);

              if (teams) {
                for (const team of teams) {
                  // Check if leader registration is pending
                  const { data: leaderReg } = await supabase
                    .from('registrations')
                    .select('status')
                    .eq('event_id', event.id)
                    .eq('user_id', team.leader_id)
                    .maybeSingle();

                  if (leaderReg?.status === 'pending') {
                    pendingCount++;
                    teamsList.push({
                      id: team.id,
                      name: team.name,
                      team_code: team.team_code,
                      logo_url: team.logo_url,
                      payment_receipt_url: team.payment_receipt_url,
                      leader_id: team.leader_id,
                      event_id: team.event_id,
                      event_title: event.title,
                      member_count: (team.team_members as any)?.[0]?.count || 0
                    });
                  }
                }
              }
            }

            // Also count individual pending registrations
            const eventIds = myEvents.map(e => e.id);
            const { count: individualPending } = await supabase
              .from('registrations')
              .select('*', { count: 'exact', head: true })
              .in('event_id', eventIds)
              .eq('status', 'pending');
            
            pendingCount = individualPending || 0;
          }
        }

        setStats({
          totalEvents: eventsCount || 0,
          myRegistrations: registrationsCount || 0,
          myEvents: myEventsCount,
          pendingApprovals: pendingCount
        });

        setPendingTeams(teamsList);

        // Fetch recent announcements
        const { data: announcementsData } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        setAnnouncements(announcementsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, role]);

  async function handleTeamApproval(team: PendingTeam, newStatus: 'approved' | 'rejected') {
    setUpdatingId(team.id);

    try {
      // Get all team members
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', team.id);

      if (members && members.length > 0) {
        // Update all team members' registrations
        const { error } = await supabase
          .from('registrations')
          .update({ status: newStatus })
          .eq('event_id', team.event_id)
          .in('user_id', members.map(m => m.user_id));

        if (error) throw error;
      }

      // Remove from local state
      setPendingTeams(prev => prev.filter(t => t.id !== team.id));
      setStats(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }));

      toast({
        title: `Team ${newStatus}`,
        description: `"${team.name}" has been ${newStatus}.`
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update team status.'
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const roleDisplay = role === 'admin' ? 'Faculty Admin' : role === 'president' ? 'Club President' : 'Student';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          You're logged in as a <span className="font-medium text-foreground">{roleDisplay}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Active campus events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Registrations</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myRegistrations}</div>
            <p className="text-xs text-muted-foreground">Events you've registered for</p>
          </CardContent>
        </Card>

        {(role === 'president' || role === 'admin') && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Events</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myEvents}</div>
                <p className="text-xs text-muted-foreground">Events you've created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">Registrations awaiting review</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Pending Team Approvals for Admins/Presidents */}
      {(role === 'president' || role === 'admin') && pendingTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Pending Team Approvals
            </CardTitle>
            <CardDescription>
              Review payment receipts and approve teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTeams.map((team) => (
              <div key={team.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={team.logo_url || undefined} />
                  <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.event_title} • {team.member_count} members • Code: {team.team_code}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  </div>
                  
                  {team.payment_receipt_url && (
                    <div className="mt-3">
                      <a 
                        href={team.payment_receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Payment Receipt
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleTeamApproval(team, 'approved')}
                      disabled={updatingId === team.id}
                    >
                      {updatingId === team.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      onClick={() => handleTeamApproval(team, 'rejected')}
                      disabled={updatingId === team.id}
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Link to="/events/manage" className="block">
              <Button variant="outline" className="w-full gap-2">
                View All Registrations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can do right now</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/events">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Browse Events
              </Button>
            </Link>
            <Link to="/registrations">
              <Button variant="outline" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                View Registrations
              </Button>
            </Link>
            {(role === 'president' || role === 'admin') && (
              <>
                <Link to="/events/create">
                  <Button className="gap-2">
                    Create Event
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/events/manage">
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Manage Events
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-b pb-3 last:border-0">
                    <p className="font-medium">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}