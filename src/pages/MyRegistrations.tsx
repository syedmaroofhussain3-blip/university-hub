import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface RegistrationWithEvent {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  events: {
    id: string;
    title: string;
    event_date: string;
    location: string;
    club_name: string;
    image_url: string | null;
  };
}

export default function MyRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRegistrations();
  }, [user]);

  async function fetchRegistrations() {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          events (
            id,
            title,
            event_date,
            location,
            club_name,
            image_url
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data as unknown as RegistrationWithEvent[]);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Registrations</h1>
        <p className="text-muted-foreground">
          Track your event registrations and their status
        </p>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't registered for any events yet.</p>
            <Link to="/events">
              <Button>Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration) => (
            <Card key={registration.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Event Image */}
                  <div className="hidden sm:block h-24 w-24 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                    {registration.events.image_url ? (
                      <img 
                        src={registration.events.image_url} 
                        alt={registration.events.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{registration.events.title}</h3>
                        <p className="text-sm text-muted-foreground">{registration.events.club_name}</p>
                      </div>
                      {getStatusBadge(registration.status)}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(registration.events.event_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{registration.events.location}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Link to={`/events/${registration.events.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                          View Event
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
