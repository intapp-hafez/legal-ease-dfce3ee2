const { createClient } = require("./node_modules/@supabase/supabase-js");

const sb = createClient(
  "https://lgemopgjsazuqxyspjzm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZW1vcGdqc2F6dXF4eXNwanptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzA3NTAsImV4cCI6MjEwMTg0Njc1MH0.bCW01f17q8wJeOe6NXAoqWulsBVKIAPWmYwyHn2dtUo"
);

// Real profile IDs from Supabase
const ADMIN_ID = "74f95e3b-88e8-466a-b35e-866cc35b893d";   // admin
const USER_ID  = "10404e28-ac51-48fb-9914-592729b36ea5";   // user
const ADMIN1_ID = "713c274f-20b2-4c04-8944-59da94ae23d5";  // admin1

// Helper: a date N days ago as ISO string
function daysAgo(n, hours = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

async function seedRepository() {
  console.log("Seeding repository folders...");

  // Root-level folders
  const folders = [
    { name: "الموظفون",              type: "folder", department: "الموارد البشرية",      parent_id: null },
    { name: "الشركة",               type: "folder", department: "الشؤون القانونية",     parent_id: null },
    { name: "العقود",               type: "folder", department: "إدارة العقود",         parent_id: null },
    { name: "القضايا القانونية",    type: "folder", department: "الشؤون القانونية",     parent_id: null },
    { name: "المستندات الحكومية",   type: "folder", department: "الشؤون الحكومية",      parent_id: null },
    { name: "السياسات والأنظمة",    type: "folder", department: "الإدارة العامة",       parent_id: null },
  ];

  const { data: insertedFolders, error: folderErr } = await sb
    .from("repository")
    .insert(folders)
    .select("id, name");

  if (folderErr) {
    console.error("Folder insert error:", folderErr.message);
    return;
  }

  console.log("Inserted folders:", insertedFolders.map(f => f.name).join(", "));

  // Map folder names to IDs
  const folderMap = {};
  insertedFolders.forEach(f => { folderMap[f.name] = f.id; });

  // Sub-files for each folder
  const files = [
    // الموظفون
    { name: "عقد عمل - أحمد السالم.pdf",      type: "file", parent_id: folderMap["الموظفون"],            department: "الموارد البشرية",    file_type: "PDF",  size: "245 KB", owner_id: ADMIN_ID },
    { name: "شهادة راتب - فاطمة حسن.pdf",     type: "file", parent_id: folderMap["الموظفون"],            department: "الموارد البشرية",    file_type: "PDF",  size: "120 KB", owner_id: USER_ID },
    { name: "هوية وطنية - خالد محمد.jpg",      type: "file", parent_id: folderMap["الموظفون"],            department: "الموارد البشرية",    file_type: "JPG",  size: "89 KB",  owner_id: ADMIN1_ID },
    // الشركة
    { name: "السجل التجاري 2026.pdf",          type: "file", parent_id: folderMap["الشركة"],              department: "الشؤون القانونية",   file_type: "PDF",  size: "512 KB", owner_id: ADMIN_ID },
    { name: "البطاقة الضريبية.pdf",            type: "file", parent_id: folderMap["الشركة"],              department: "الشؤون القانونية",   file_type: "PDF",  size: "340 KB", owner_id: ADMIN_ID },
    { name: "عقد تأسيس الشركة.pdf",            type: "file", parent_id: folderMap["الشركة"],              department: "الشؤون القانونية",   file_type: "PDF",  size: "1.2 MB", owner_id: ADMIN1_ID },
    // العقود
    { name: "عقد خدمات - شركة التقنية.pdf",   type: "file", parent_id: folderMap["العقود"],              department: "إدارة العقود",       file_type: "PDF",  size: "189 KB", owner_id: ADMIN_ID },
    { name: "عقد إيجار المكتب الرئيسي.pdf",   type: "file", parent_id: folderMap["العقود"],              department: "إدارة العقود",       file_type: "PDF",  size: "267 KB", owner_id: USER_ID },
    { name: "عقد صيانة الأنظمة.pdf",           type: "file", parent_id: folderMap["العقود"],              department: "إدارة العقود",       file_type: "PDF",  size: "155 KB", owner_id: ADMIN1_ID },
    // القضايا القانونية
    { name: "لائحة دعوى CS-2024-001.pdf",      type: "file", parent_id: folderMap["القضايا القانونية"],  department: "الشؤون القانونية",   file_type: "PDF",  size: "890 KB", owner_id: ADMIN_ID },
    { name: "حكم محكمة عمل 2025.pdf",          type: "file", parent_id: folderMap["القضايا القانونية"],  department: "الشؤون القانونية",   file_type: "PDF",  size: "450 KB", owner_id: ADMIN1_ID },
    // المستندات الحكومية
    { name: "رخصة المنشأة 2026.pdf",           type: "file", parent_id: folderMap["المستندات الحكومية"], department: "الشؤون الحكومية",    file_type: "PDF",  size: "320 KB", owner_id: ADMIN_ID },
    { name: "شهادة التأمينات الاجتماعية.pdf",  type: "file", parent_id: folderMap["المستندات الحكومية"], department: "الشؤون الحكومية",    file_type: "PDF",  size: "210 KB", owner_id: USER_ID },
    // السياسات والأنظمة
    { name: "دليل الموظف 2025.pdf",            type: "file", parent_id: folderMap["السياسات والأنظمة"],  department: "الإدارة العامة",     file_type: "PDF",  size: "1.8 MB", owner_id: ADMIN_ID },
    { name: "سياسة حماية البيانات PDPL.pdf",   type: "file", parent_id: folderMap["السياسات والأنظمة"],  department: "الإدارة العامة",     file_type: "PDF",  size: "670 KB", owner_id: ADMIN1_ID },
  ];

  const { error: filesErr } = await sb.from("repository").insert(files);
  if (filesErr) console.error("Files insert error:", filesErr.message);
  else console.log("Inserted", files.length, "files.");
}

async function seedAuditLogs() {
  console.log("\nSeeding audit_logs...");

  const logs = [
    { user_id: ADMIN_ID,  action: "تحديث مصفوفة الصلاحيات وقواعد الإشعارات",           target: "الإعدادات والصلاحيات",            ip_address: "10.0.4.18", action_time: daysAgo(0, 0) },
    { user_id: USER_ID,   action: "اعتماد وتوثيق عقد موظف جديد",                        target: "عقد CT-2289 (أحمد السالم)",       ip_address: "10.0.4.22", action_time: daysAgo(0, 1) },
    { user_id: ADMIN1_ID, action: "رفع نسخة محدثة من السجل التجاري",                   target: "DOC-1001 (وزارة التجارة)",        ip_address: "10.0.4.30", action_time: daysAgo(0, 3) },
    { user_id: ADMIN_ID,  action: "تسجيل عهدة جديدة للموظف أحمد سالم",                 target: "AST-3301 (Dell Latitude 5540)",   ip_address: "10.0.4.18", action_time: daysAgo(0, 6) },
    { user_id: null,      action: "فحص دوري وإرسال تنبيهات انتهاء العقود والمستندات",   target: "عقود ومستندات الشركة",            ip_address: "127.0.0.1", action_time: daysAgo(1, 0) },
    { user_id: USER_ID,   action: "إضافة جلسة محكمة جديدة للقضية CS-2024-001",          target: "قضية - محكمة العمل",              ip_address: "10.0.4.22", action_time: daysAgo(1, 5) },
    { user_id: ADMIN_ID,  action: "إسناد مهمة قانونية للمستشار محمد العمري",             target: "TSK-0089 (صياغة عقد)",           ip_address: "10.0.4.18", action_time: daysAgo(2, 0) },
    { user_id: ADMIN1_ID, action: "رفع ملف سياسة حماية البيانات PDPL",                  target: "مستودع المستندات / السياسات",     ip_address: "10.0.4.30", action_time: daysAgo(2, 3) },
    { user_id: ADMIN_ID,  action: "تحديث بيانات الموظف فاطمة حسن",                      target: "ملف الموظفة (EMP-00142)",         ip_address: "10.0.4.18", action_time: daysAgo(3, 0) },
    { user_id: USER_ID,   action: "تقديم طلب استشارة قانونية جديدة",                     target: "REQ-2026-014 (استشارة تجارية)",   ip_address: "10.0.4.22", action_time: daysAgo(4, 0) },
  ];

  const { error } = await sb.from("audit_logs").insert(logs);
  if (error) console.error("Audit insert error:", error.message);
  else console.log("Inserted", logs.length, "audit log entries.");
}

async function main() {
  await seedRepository();
  await seedAuditLogs();

  // Verify
  const { data: repoCount } = await sb.from("repository").select("*", { count: "exact", head: true });
  const { data: auditCount } = await sb.from("audit_logs").select("*", { count: "exact", head: true });
  console.log("\n✅ Done. repository rows:", repoCount, "audit_logs rows:", auditCount);
}

main().catch(console.error);
