-- 20260811000001_setup_storage_and_sync.sql

-- 1. Setup Supabase Storage Bucket for legal documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('legal_documents', 'legal_documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Setup RLS policies for storage bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'legal_documents');

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'legal_documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'legal_documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'legal_documents' AND auth.role() = 'authenticated');

-- 3. Create Trigger Function to sync Document uploads to Repository
CREATE OR REPLACE FUNCTION sync_document_to_repository()
RETURNS TRIGGER AS $$
DECLARE
  v_folder_id uuid;
BEGIN
  IF NEW.attachment IS NOT NULL AND NEW.repository_folder_id IS NOT NULL THEN
    
    -- Determine if repository_folder_id is a valid UUID
    IF NEW.repository_folder_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_folder_id := NEW.repository_folder_id::uuid;
    ELSE
      -- It's a folder name, look up the ID
      SELECT id INTO v_folder_id FROM public.repository 
      WHERE name = NEW.repository_folder_id AND type = 'folder' 
      LIMIT 1;
      
      -- If folder doesn't exist, create it on the fly
      IF v_folder_id IS NULL THEN
        INSERT INTO public.repository (name, type) 
        VALUES (NEW.repository_folder_id, 'folder')
        RETURNING id INTO v_folder_id;
      END IF;
    END IF;

    -- Check if this specific attachment already exists in the repository for this document
    IF NOT EXISTS (
      SELECT 1 FROM public.repository 
      WHERE parent_id = v_folder_id
        AND name = NEW.attachment
    ) THEN
      -- Insert a new file entry in the repository
      INSERT INTO public.repository (
        name, 
        type, 
        parent_id, 
        file_url,
        owner_id,
        department,
        category,
        file_type
      ) VALUES (
        NEW.attachment,
        'file',
        v_folder_id,
        NEW.file_url,
        NEW.owner_id,
        'General',
        NEW.category,
        'مستند'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to documents table
DROP TRIGGER IF EXISTS trigger_sync_document_to_repository ON public.documents;
CREATE TRIGGER trigger_sync_document_to_repository
AFTER INSERT OR UPDATE OF attachment, repository_folder_id, file_url
ON public.documents
FOR EACH ROW
EXECUTE FUNCTION sync_document_to_repository();
