-- 15. Task Activities (ملاحظات ونشاطات المهام)
CREATE TABLE public.task_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  activity_type TEXT DEFAULT 'ملاحظة', -- 'ملاحظة', 'تغيير حالة', 'تحديث'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply triggers for updated_at
CREATE TRIGGER update_task_activities_modtime BEFORE UPDATE ON public.task_activities FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- RLS POLICIES FOR NEW TABLES
-- -------------------------------------------------------------

-- Task Activities: Viewable by assignee or Admins
CREATE POLICY "Task activities viewable by task assignee or admins" ON public.task_activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_activities.task_id 
    AND (tasks.assignee_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('مدير النظام', 'المستشار القانوني')))
  )
);
CREATE POLICY "Users can add activities to their tasks" ON public.task_activities FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
