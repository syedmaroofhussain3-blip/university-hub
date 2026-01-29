import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, ClipboardList, Megaphone, ArrowRight, Bell } from 'lucide-react';
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

export default function Dashboard() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ 
    totalEvents: 0, 
    myRegistrations: 0, 
    myEvents: 0, 
    pendingApprovals: 0 
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        if (role === 'president' || role === 'admin') {
          const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id);
          myEventsCount = count || 0;

          // Fetch pending approvals for my events
          const { data: myEvents } = await supabase
            .from('events')
            .select('id')
            .eq('created_by', user.id);

          if (myEvents && myEvents.length > 0) {
            const eventIds = myEvents.map(e => e.id);
            const { count: pending } = await supabase
              .from('registrations')
              .select('*', { count: 'exact', head: true })
              .in('event_id', eventIds)
              .eq('status', 'pending');
            pendingCount = pending || 0;
          }
        }

        setStats({
          totalEvents: eventsCount || 0,
          myRegistrations: registrationsCount || 0,
          myEvents: myEventsCount,
          pendingApprovals: pendingCount
        });

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
              <Link to="/events/create">
                <Button className="gap-2">
                  Create Event
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
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
