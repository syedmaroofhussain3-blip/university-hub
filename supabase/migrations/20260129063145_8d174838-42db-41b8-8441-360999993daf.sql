-- Allow event creators and admins to read profiles of users who registered for their events
CREATE POLICY "Event creators can read registrant profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    JOIN events e ON e.id = r.event_id
    WHERE r.user_id = profiles.user_id
    AND (e.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);