import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  capacity: number;
  image_url: string | null;
  club_name: string;
  created_by: string;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface EventCardProps {
  event: Event;
  registration?: Registration | null;
  registrationCount?: number;
  onRegister?: (eventId: string) => void;
  isRegistering?: boolean;
  showManage?: boolean;
}

export function EventCard({ 
  event, 
  registration, 
  registrationCount = 0,
  onRegister, 
  isRegistering,
  showManage 
}: EventCardProps) {
  const getStatusBadge = () => {
    if (!registration) return null;
    
    switch (registration.status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const isPast = new Date(event.event_date) < new Date();
  const isFull = registrationCount >= event.capacity;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="aspect-video relative bg-muted">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
        {isPast && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-lg">Event Ended</Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold line-clamp-1">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.club_name}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {event.description || 'No description available.'}
        </p>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{registrationCount} / {event.capacity} registered</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        {showManage ? (
          <Link to={`/events/${event.id}/manage`} className="flex-1">
            <Button variant="outline" className="w-full">Manage</Button>
          </Link>
        ) : (
          <>
            <Link to={`/events/${event.id}`} className="flex-1">
              <Button variant="outline" className="w-full">View Details</Button>
            </Link>
            {!registration && !isPast && onRegister && (
              <Button 
                className="flex-1" 
                onClick={() => onRegister(event.id)}
                disabled={isRegistering || isFull}
              >
                {isRegistering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFull ? (
                  'Full'
                ) : (
                  'Register'
                )}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
