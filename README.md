# Boruto: Two Blue Vortex — Supabase version

هذه النسخة مربوطة بمشروع Supabase الخاص بالموقع باستخدام Project URL وPublishable Key.

## ما تم ربطه
- بيانات المانجا والفصول من Supabase Database.
- تسجيل دخول لوحة الإدارة عبر Supabase Auth.
- رفع صفحات الفصول إلى Storage bucket باسم `manga-pages`.
- قارئ الفصل يقرأ الصور من Storage.

## مهم
- لا تضع Secret Key أو Service Role Key في ملفات الموقع.
- المفتاح الموجود في `config.js` هو Publishable Key ومصمم للاستخدام في المتصفح مع RLS.
- نفّذ `storage-policies.sql` داخل Supabase SQL Editor قبل محاولة رفع صور الفصول.
- استخدم فقط الصفحات والصور التي تملك حق نشرها أو لديك ترخيص لنشرها.

## النشر
ارفع ملفات هذه النسخة إلى مستودع GitHub المرتبط بـ Cloudflare Pages، مع الحفاظ على مجلد `assets`.
