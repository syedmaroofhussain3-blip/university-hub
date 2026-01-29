-- Allow users to insert their own profile and role on signup
CREATE POLICY "Users can insert own role on signup"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);