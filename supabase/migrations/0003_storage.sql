-- =====================================================================
--  MedAI Academy — file storage for payment screenshots (step 3 of 3)
--  Creates a PRIVATE bucket. Files are stored as <user-id>/<file-name>.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Learners can upload into their own folder only
drop policy if exists "payment proofs: upload own" on storage.objects;
create policy "payment proofs: upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Learners can view their own files; admins can view all
drop policy if exists "payment proofs: read own or admin" on storage.objects;
create policy "payment proofs: read own or admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

-- Only admins can delete payment proofs
drop policy if exists "payment proofs: admin delete" on storage.objects;
create policy "payment proofs: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and (select public.is_admin()));
