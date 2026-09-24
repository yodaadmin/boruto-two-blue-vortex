-- سياسات Storage اللازمة لرفع صفحات الفصول من لوحة الإدارة.
-- Bucket: manga-pages (اجعله Public كما أنشأته بالفعل).

create policy "authenticated upload manga pages"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'manga-pages');

create policy "authenticated update manga pages"
on storage.objects
for update
to authenticated
using (bucket_id = 'manga-pages')
with check (bucket_id = 'manga-pages');

create policy "authenticated delete manga pages"
on storage.objects
for delete
to authenticated
using (bucket_id = 'manga-pages');
