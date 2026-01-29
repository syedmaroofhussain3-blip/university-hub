import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, X } from 'lucide-react';
import PaymentSection from '@/components/events/PaymentSection';
import TeamSettings from '@/components/events/TeamSettings';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(2000).optional(),
  eventDate: z.string().min(1, 'Date is required'),
  eventTime: z.string().min(1, 'Time is required'),
  location: z.string().min(2, 'Location is required').max(200),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').max(10000),
  clubName: z.string().min(2, 'Club name is required').max(100)
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Team settings
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual');
  const [minTeamSize, setMinTeamSize] = useState('2');
  const [maxTeamSize, setMaxTeamSize] = useState('');
  
  // Payment settings
  const [isPaid, setIsPaid] = useState(false);
  const [registrationFee, setRegistrationFee] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      location: '',
      capacity: 50,
      clubName: ''
    }
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function handleQrChange(file: File | null, preview: string | null) {
    setQrFile(file);
    setQrPreview(preview);
  }

  async function onSubmit(values: EventFormValues) {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let imageUrl: string | null = null;
      let paymentQrUrl: string | null = null;

      // Upload event image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Upload payment QR if provided
      if (qrFile && isPaid) {
        const fileExt = qrFile.name.split('.').pop();
        const fileName = `${user.id}/qr-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, qrFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);
        
        paymentQrUrl = publicUrl;
      }

      // Combine date and time
      const eventDateTime = new Date(`${values.eventDate}T${values.eventTime}`);

      // Create event
      const { error } = await supabase
        .from('events')
        .insert({
          title: values.title,
          description: values.description || null,
          event_date: eventDateTime.toISOString(),
          location: values.location,
          capacity: values.capacity,
          club_name: values.clubName,
          image_url: imageUrl,
          created_by: user.id,
          registration_type: registrationType,
          min_team_size: registrationType === 'team' ? parseInt(minTeamSize) || 2 : 2,
          max_team_size: registrationType === 'team' && maxTeamSize ? parseInt(maxTeamSize) : null,
          is_paid: isPaid,
          registration_fee: isPaid && registrationFee ? parseFloat(registrationFee) : null,
          upi_id: isPaid && upiId ? upiId : null,
          payment_qr_url: paymentQrUrl
        });

      if (error) throw error;

      toast({
        title: 'Event created!',
        description: 'Your event is now visible to students.'
      });

      navigate('/events/manage');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating event',
        description: error.message || 'Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Fill in the details below to create a new campus event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Image</label>
                {imagePreview ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Click to upload an image
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Annual Tech Hackathon 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clubName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club / Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Science Society" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell participants what this event is about..."
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Auditorium, Building A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Settings */}
              <TeamSettings
                registrationType={registrationType}
                onRegistrationTypeChange={setRegistrationType}
                minTeamSize={minTeamSize}
                onMinTeamSizeChange={setMinTeamSize}
                maxTeamSize={maxTeamSize}
                onMaxTeamSizeChange={setMaxTeamSize}
              />

              {/* Payment Settings */}
              <PaymentSection
                isPaid={isPaid}
                onIsPaidChange={setIsPaid}
                registrationFee={registrationFee}
                onRegistrationFeeChange={setRegistrationFee}
                upiId={upiId}
                onUpiIdChange={setUpiId}
                qrPreview={qrPreview}
                onQrChange={handleQrChange}
              />

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/events/manage')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Event
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}