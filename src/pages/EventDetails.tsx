import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Event, Registration } from '@/components/events/EventCard';
import { Calendar, MapPin, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (id) fetchEventDetails();
  }, [id, user]);

  async function fetchEventDetails() {
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch registration count
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id);
      setRegistrationCount(count || 0);

      // Fetch user's registration
      if (user) {
        const { data: regData } = await supabase
          .from('registrations')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setRegistration(regData as Registration | null);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        variant: 'destructive',
        title: 'Event not found'
      });
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister() {
    if (!user || !event) return;
    
    setIsRegistering(true);
    
    // Optimistic update
    setRegistration({ id: 'temp', event_id: event.id, status: 'pending' });

    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          event_id: event.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setRegistration(data as Registration);
      setRegistrationCount(prev => prev + 1);

      toast({
        title: 'Registration submitted!',
        description: 'Your registration is pending approval.'
      });
    } catch (error: any) {
      setRegistration(null);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'Please try again.'
      });
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleCancelRegistration() {
    if (!registration || registration.id === 'temp') return;
    
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registration.id);

      if (error) throw error;

      setRegistration(null);
      setRegistrationCount(prev => prev - 1);

      toast({
        title: 'Registration cancelled',
        description: 'You have been unregistered from this event.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to cancel registration.'
      });
    }
  }

  const getStatusBadge = () => {
    if (!registration) return null;
    
    switch (registration.status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600 text-base px-4 py-1">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-base px-4 py-1">Pending Approval</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-base px-4 py-1">Rejected</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!event) return null;

  const isPast = new Date(event.event_date) < new Date();
  const isFull = registrationCount >= event.capacity;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/events')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Button>

      {/* Event Image */}
      <div className="aspect-video relative rounded-xl overflow-hidden bg-muted">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Calendar className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        {isPast && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-xl py-2 px-4">Event Ended</Badge>
          </div>
        )}
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <p className="text-muted-foreground mt-1">Organized by {event.club_name}</p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">{format(new Date(event.event_date), 'MMM d, yyyy')}</p>
                <p className="text-sm">{format(new Date(event.event_date), 'h:mm a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-medium">{registrationCount} / {event.capacity}</p>
                <p className="text-sm">{event.capacity - registrationCount} spots left</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">About this event</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {event.description || 'No description provided.'}
            </p>
          </div>

          {/* Registration Actions */}
          {!isPast && (
            <div className="flex gap-4">
              {registration ? (
                registration.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelRegistration}
                  >
                    Cancel Registration
                  </Button>
                )
              ) : (
                <Button 
                  size="lg"
                  onClick={handleRegister}
                  disabled={isRegistering || isFull}
                  className="gap-2"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : isFull ? (
                    'Event is Full'
                  ) : (
                    'Register for this Event'
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
