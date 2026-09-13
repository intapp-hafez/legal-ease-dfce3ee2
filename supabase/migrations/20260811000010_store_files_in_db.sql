-- 20260811000010_store_files_in_db.sql

-- 1. Add file_data column to documents
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_data TEXT;

-- 2. Update trigger to create folder if it doesn't exist and save file_data
CREATE OR REPLACE FUNCTION sync_document_to_repository()
RETURNS TRIGGER AS $$
DECLARE
  v_folder_id uuid;
BEGIN
  IF NEW.attachment IS NOT NULL THEN
    
    -- Check if repository_folder_id is provided, otherwise create a folder
    IF NEW.repository_folder_id IS NULL THEN
      -- Automatically create a folder using the document's name
      INSERT INTO public.repository (name, type) 
      VALUES (NEW.name, 'folder')
      RETURNING id INTO v_folder_id;
      
      -- Update NEW with the newly created folder id
      NEW.repository_folder_id := v_folder_id::text;
    ELSIF NEW.repository_folder_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
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
        COALESCE(NEW.file_data, NEW.file_url),
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

-- 3. Attach trigger to documents table again in case we need to trigger on file_data
DROP TRIGGER IF EXISTS trigger_sync_document_to_repository ON public.documents;
CREATE TRIGGER trigger_sync_document_to_repository
BEFORE INSERT OR UPDATE OF attachment, repository_folder_id, file_url, file_data
ON public.documents
FOR EACH ROW
EXECUTE FUNCTION sync_document_to_repository();
