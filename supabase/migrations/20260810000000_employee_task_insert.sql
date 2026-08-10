-- Users can create tasks if they assign the task to themselves
CREATE POLICY "Users can create tasks assigned to themselves" ON public.tasks FOR INSERT WITH CHECK (
  auth.uid() = assignee_id
);
