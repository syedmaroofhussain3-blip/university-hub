import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCard, Event, Registration } from '@/components/events/EventCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, Registration>>({});
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  async function fetchEvents() {
    try {
      // Fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch user's registrations
      if (user) {
        const { data: regsData } = await supabase
          .from('registrations')
          .select('*')
          .eq('user_id', user.id);

        const regsMap: Record<string, Registration> = {};
        regsData?.forEach(reg => {
          regsMap[reg.event_id] = reg as Registration;
        });
        setRegistrations(regsMap);
      }

      // Fetch registration counts for each event
      if (eventsData && eventsData.length > 0) {
        const counts: Record<string, number> = {};
        for (const event of eventsData) {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          counts[event.id] = count || 0;
        }
        setRegistrationCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(eventId: string) {
    if (!user) return;
    
    setRegisteringId(eventId);
    
    // Optimistic update
    setRegistrations(prev => ({
      ...prev,
      [eventId]: { id: 'temp', event_id: eventId, status: 'pending' }
    }));

    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          event_id: eventId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setRegistrations(prev => ({
        ...prev,
        [eventId]: data as Registration
      }));

      setRegistrationCounts(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || 0) + 1
      }));

      toast({
        title: 'Registration submitted!',
        description: 'Your registration is pending approval.'
      });
    } catch (error: any) {
      // Revert optimistic update
      setRegistrations(prev => {
        const newRegs = { ...prev };
        delete newRegs[eventId];
        return newRegs;
      });

      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'Please try again.'
      });
    } finally {
      setRegisteringId(null);
    }
  }

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browse Events</h1>
        <p className="text-muted-foreground">
          Discover and register for upcoming campus events
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'No events match your search.' : 'No events available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registration={registrations[event.id]}
              registrationCount={registrationCounts[event.id]}
              onRegister={handleRegister}
              isRegistering={registeringId === event.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
