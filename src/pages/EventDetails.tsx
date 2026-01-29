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
import { Calendar, MapPin, Users, ArrowLeft, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import TeamRegistration from '@/components/events/TeamRegistration';

interface ExtendedEvent extends Event {
  registration_type?: 'individual' | 'team';
  min_team_size?: number;
  max_team_size?: number | null;
  is_paid?: boolean;
  registration_fee?: number | null;
  upi_id?: string | null;
  payment_qr_url?: string | null;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTeamRegistration, setShowTeamRegistration] = useState(false);
  const [userTeam, setUserTeam] = useState<{ name: string; code: string; memberCount: number } | null>(null);

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
      setEvent(eventData as unknown as ExtendedEvent);

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

        // If team event, check if user is in a team
        if (eventData.registration_type === 'team') {
          const { data: teamMembership } = await supabase
            .from('team_members')
            .select(`
              team_id,
              teams (
                name,
                team_code,
                team_members (count)
              )
            `)
            .eq('user_id', user.id)
            .eq('teams.event_id', id)
            .maybeSingle();

          if (teamMembership?.teams) {
            const team = teamMembership.teams as any;
            setUserTeam({
              name: team.name,
              code: team.team_code,
              memberCount: team.team_members?.[0]?.count || 1
            });
          }
        }
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
    
    // Optimistic update - auto-approve for individual events
    setRegistration({ id: 'temp', event_id: event.id, status: 'approved' });

    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          event_id: event.id,
          status: 'approved' // Auto-approve for individual registrations
        })
        .select()
        .single();

      if (error) throw error;

      setRegistration(data as Registration);
      setRegistrationCount(prev => prev + 1);

      toast({
        title: 'Registration confirmed!',
        description: 'You are registered for this event.'
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

          {/* Event Type & Payment Badges */}
          <div className="flex flex-wrap gap-2">
            {event.registration_type === 'team' && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                Team Event ({event.min_team_size || 2} - {event.max_team_size || '∞'} members)
              </Badge>
            )}
            {event.registration_type === 'individual' && (
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                Individual Registration
              </Badge>
            )}
            {event.is_paid && event.registration_fee ? (
              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200 bg-orange-50">
                ₹{event.registration_fee} Registration Fee
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Free Entry
              </Badge>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">About this event</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {event.description || 'No description provided.'}
            </p>
          </div>

          {/* Team Info for registered users */}
          {userTeam && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{userTeam.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {userTeam.memberCount} member{userTeam.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Team Code</p>
                    <p className="font-mono font-bold text-primary">{userTeam.code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Registration UI */}
          {showTeamRegistration && event.registration_type === 'team' && user && (
            <TeamRegistration
              eventId={event.id}
              userId={user.id}
              minTeamSize={event.min_team_size || 2}
              maxTeamSize={event.max_team_size || null}
              isPaid={event.is_paid || false}
              registrationFee={event.registration_fee || null}
              paymentQrUrl={event.payment_qr_url || null}
              upiId={event.upi_id || null}
              onSuccess={() => {
                setShowTeamRegistration(false);
                fetchEventDetails();
              }}
            />
          )}

          {/* Registration Actions */}
          {!isPast && !showTeamRegistration && (
            <div className="flex gap-4">
              {registration ? (
                <>
                  {registration.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      onClick={handleCancelRegistration}
                    >
                      Cancel Registration
                    </Button>
                  )}
                </>
              ) : event.registration_type === 'team' ? (
                <Button 
                  size="lg"
                  onClick={() => setShowTeamRegistration(true)}
                  disabled={isFull}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  {isFull ? 'Event is Full' : 'Create or Join Team'}
                </Button>
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
