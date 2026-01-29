import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, Users, ClipboardList, Megaphone, ArrowRight, Bell, 
  Check, X, Loader2, ExternalLink, Sparkles, LayoutDashboard, Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { FadeInUp, StaggerContainer, StaggerItem, FloatingCard } from '@/components/ui/motion';

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
        <Skeleton className="h-8 w-48 bg-white/5" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Events', 
      value: stats.totalEvents, 
      icon: Calendar, 
      description: 'Active campus events',
      color: 'cyan' as const
    },
    { 
      label: 'My Registrations', 
      value: stats.myRegistrations, 
      icon: ClipboardList, 
      description: "Events you've registered for",
      color: 'magenta' as const
    },
    ...(role === 'president' || role === 'admin' ? [
      { 
        label: 'My Events', 
        value: stats.myEvents, 
        icon: Users, 
        description: "Events you've created",
        color: 'violet' as const
      },
      { 
        label: 'Pending Approvals', 
        value: stats.pendingApprovals, 
        icon: Bell, 
        description: 'Registrations awaiting review',
        color: 'cyan' as const
      }
    ] : [])
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeInUp>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl aurora-gradient">
            <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">
              You're logged in as a <span className="text-aurora-cyan font-medium">{roleDisplay}</span>
            </p>
          </div>
        </div>
      </FadeInUp>

      {/* Stats Cards */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const glowColors = {
            cyan: 'hover:shadow-[0_0_30px_-10px_hsl(192_95%_60%/0.4)]',
            magenta: 'hover:shadow-[0_0_30px_-10px_hsl(330_85%_60%/0.4)]',
            violet: 'hover:shadow-[0_0_30px_-10px_hsl(280_80%_65%/0.4)]',
          };
          const iconColors = {
            cyan: 'text-aurora-cyan bg-aurora-cyan/20',
            magenta: 'text-aurora-magenta bg-aurora-magenta/20',
            violet: 'text-aurora-violet bg-aurora-violet/20',
          };
          
          return (
            <StaggerItem key={stat.label}>
              <motion.div
                whileHover={{ y: -3 }}
                className={`glass-card p-5 transition-shadow duration-300 ${glowColors[stat.color]}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconColors[stat.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="font-display text-3xl font-bold text-gradient">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Pending Team Approvals */}
      {(role === 'president' || role === 'admin') && pendingTeams.length > 0 && (
        <FadeInUp>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Pending Team Approvals</h2>
                <p className="text-sm text-muted-foreground">Review payment receipts and approve teams</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {pendingTeams.map((team) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-4 p-4 rounded-xl glass border-white/5"
                >
                  <Avatar className="h-12 w-12 ring-2 ring-white/10">
                    <AvatarImage src={team.logo_url || undefined} />
                    <AvatarFallback className="aurora-gradient text-primary-foreground font-semibold">
                      {team.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.event_title} • {team.member_count} members • Code: {team.team_code}
                        </p>
                      </div>
                      <Badge className="bg-warning/20 text-warning border-0">
                        Pending
                      </Badge>
                    </div>
                    
                    {team.payment_receipt_url && (
                      <div className="mt-3">
                        <a 
                          href={team.payment_receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-aurora-cyan hover:underline"
                        >
                          <Receipt className="h-4 w-4" />
                          View Payment Receipt
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          className="gap-1 bg-success hover:bg-success/90"
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
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.95 }}>
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
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <Link to="/events/manage">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="w-full gap-2 glass border-white/10 hover:bg-white/5">
                    View All Registrations
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </FadeInUp>
      )}

      {/* Quick Actions & Announcements */}
      <div className="grid gap-6 md:grid-cols-2">
        <FadeInUp>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-aurora-cyan" />
              <h2 className="font-display text-lg font-bold">Quick Actions</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/events">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="gap-2 glass border-white/10 hover:bg-white/5">
                    <Calendar className="h-4 w-4" />
                    Browse Events
                  </Button>
                </motion.div>
              </Link>
              <Link to="/registrations">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="gap-2 glass border-white/10 hover:bg-white/5">
                    <ClipboardList className="h-4 w-4" />
                    View Registrations
                  </Button>
                </motion.div>
              </Link>
              {(role === 'president' || role === 'admin') && (
                <>
                  <Link to="/events/create">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button className="gap-2 aurora-gradient border-0">
                        Create Event
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/events/manage">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="gap-2 glass border-white/10 hover:bg-white/5">
                        <Users className="h-4 w-4" />
                        Manage Events
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </FadeInUp>

        <FadeInUp>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Megaphone className="h-5 w-5 text-aurora-magenta" />
              <h2 className="font-display text-lg font-bold">Recent Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-b border-white/5 pb-3 last:border-0">
                    <p className="font-medium text-sm">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {announcement.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeInUp>
      </div>
    </div>
  );
}
