import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Loader2, DollarSign, UsersRound } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  registration_type?: 'individual' | 'team';
  is_paid?: boolean;
  registration_fee?: number | null;
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
  const isPast = new Date(event.event_date) < new Date();
  const isFull = registrationCount >= event.capacity;
  const isPaid = event.is_paid && event.registration_fee;
  const isTeam = event.registration_type === 'team';

  // Generate a placeholder gradient based on event id
  const gradients = [
    'from-[hsl(192,95%,60%,0.3)] to-[hsl(330,85%,60%,0.3)]',
    'from-[hsl(330,85%,60%,0.3)] to-[hsl(280,80%,65%,0.3)]',
    'from-[hsl(280,80%,65%,0.3)] to-[hsl(192,95%,60%,0.3)]',
  ];
  const gradientIndex = event.id.charCodeAt(0) % gradients.length;

  const getStatusBadge = () => {
    if (!registration) return null;
    
    const statusStyles = {
      approved: 'bg-success text-white border-0',
      pending: 'bg-warning text-white border-0',
      rejected: 'bg-destructive text-white border-0',
    };

    return (
      <Badge className={cn('capitalize', statusStyles[registration.status])}>
        {registration.status}
      </Badge>
    );
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_40px_-10px_hsl(192_95%_60%/0.3)] group"
    >
      {/* Image / Gradient Placeholder */}
      <div className="relative h-40 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={cn(
            'h-full w-full bg-gradient-to-br flex items-center justify-center',
            gradients[gradientIndex]
          )}>
            <Calendar className="h-12 w-12 text-white/30" />
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isPaid ? (
            <Badge className="bg-aurora-magenta/90 text-white border-0">
              <DollarSign className="mr-1 h-3 w-3" />
              ₹{event.registration_fee}
            </Badge>
          ) : (
            <Badge className="bg-success/90 text-white border-0">
              Free
            </Badge>
          )}
          {isTeam && (
            <Badge variant="secondary" className="glass border-white/20 text-white">
              <UsersRound className="mr-1 h-3 w-3" />
              Team
            </Badge>
          )}
        </div>
        
        {/* Registration status */}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>

        {/* Past event overlay */}
        {isPast && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="secondary" className="text-base glass border-white/20">
              Event Ended
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">
            {event.club_name}
          </Badge>
        </div>
        
        <h3 className="font-display font-semibold text-lg mb-1 line-clamp-1 group-hover:text-aurora-cyan transition-colors">
          {event.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
          {event.description || 'No description available.'}
        </p>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-aurora-cyan" />
            <span>{format(new Date(event.event_date), 'EEE, MMM d • h:mm a')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-aurora-magenta" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-aurora-violet" />
            <span>{registrationCount} / {event.capacity} registered</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {showManage ? (
            <Link to={`/events/${event.id}/manage`} className="flex-1">
              <Button variant="outline" className="w-full glass border-white/20 hover:bg-white/10">
                Manage
              </Button>
            </Link>
          ) : (
            <>
              <Link to={`/events/${event.id}`} className="flex-1">
                <Button variant="outline" className="w-full glass border-white/20 hover:bg-white/10">
                  View Details
                </Button>
              </Link>
              {!registration && !isPast && onRegister && (
                <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                  <Button 
                    className="w-full aurora-gradient border-0 font-semibold" 
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
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
