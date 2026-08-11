// Mock data for the INT Legal Management System (frontend-only prototype)

export type Status =
  | "نشط"
  | "منتهي"
  | "مؤرشف"
  | "قيد المراجعة"
  | "معتمد"
  | "موقّع"
  | "مسودة";

export const kpis = [
  { label: "إجمالي الموظفين", value: 248, icon: "users", tone: "default" },
  { label: "العقود النشطة", value: 196, icon: "fileCheck", tone: "success" },
  { label: "عقود تنتهي قريبًا", value: 14, icon: "clock", tone: "warning" },
  { label: "عقود منتهية", value: 6, icon: "fileX", tone: "danger" },
  { label: "بانتظار التوقيع", value: 9, icon: "penLine", tone: "warning" },
  { label: "عهد مسندة للموظفين", value: 312, icon: "package", tone: "default" },
  { label: "عهد بانتظار الإرجاع", value: 11, icon: "undo", tone: "warning" },
  { label: "مستندات الشركة", value: 87, icon: "folder", tone: "default" },
  { label: "تراخيص تنتهي قريبًا", value: 4, icon: "badgeAlert", tone: "danger" },
  { label: "قضايا مفتوحة", value: 7, icon: "gavel", tone: "default" },
  { label: "مهام اليوم", value: 12, icon: "listChecks", tone: "success" },
  { label: "مهام متأخرة", value: 3, icon: "alarmClock", tone: "danger" },
] as const;

export const upcomingExpirations = [
  { name: "السجل التجاري", type: "مستند شركة", date: "2026-08-19", days: 17 },
  { name: "عقد م. أحمد سالم", type: "عقد موظف", date: "2026-08-25", days: 23 },
  { name: "البطاقة الضريبية", type: "مستند شركة", date: "2026-09-02", days: 31 },
  { name: "بوليصة التأمين الطبي", type: "تأمين", date: "2026-09-14", days: 43 },
  { name: "عقد إيجار المقر الرئيسي", type: "عقد إيجار", date: "2026-10-01", days: 60 },
];

export const todayTasks = [
  { id: "TSK-1042", title: "مراجعة عقد المورد الجديد", priority: "عالية", status: "قيد التنفيذ", progress: 60 },
  { id: "TSK-1043", title: "حضور جلسة المحكمة التجارية", priority: "عاجلة", status: "جديدة", progress: 0 },
  { id: "TSK-1044", title: "تجديد رخصة الاستيراد", priority: "متوسطة", status: "بانتظار", progress: 35 },
  { id: "TSK-1045", title: "إعداد إفادة راتب للموظف م. خالد", priority: "منخفضة", status: "قيد التنفيذ", progress: 80 },
  { id: "TSK-1046", title: "تحقيق في مخالفة تأخير متكرر", priority: "عالية", status: "متأخرة", progress: 20 },
];

export const recentActivities = [
  { user: "أ. حافظ رحيم", action: "رفع نسخة محدثة من السجل التجاري", time: "قبل 12 دقيقة" },
  { user: "إدارة الموارد البشرية", action: "اعتمدت عقد الموظف رقم CT-2291", time: "قبل ساعة" },
  { user: "أ. حافظ رحيم", action: "أغلق القضية رقم CS-118", time: "قبل 3 ساعات" },
  { user: "م. سارة يوسف", action: "أرجعت عهدة: لابتوب Dell 5540", time: "أمس" },
  { user: "النظام", action: "أرسل تذكير انتهاء 4 مستندات", time: "أمس" },
];

export const notifications = [
  { text: "السجل التجاري ينتهي خلال 17 يومًا", level: "تحذير" },
  { text: "3 مهام متأخرة تحتاج متابعة", level: "خطر" },
  { text: "طلب قانوني جديد بانتظار مراجعتك", level: "معلومة" },
  { text: "عهدة لم تُرجع بعد انتهاء الخدمة", level: "خطر" },
];

export const companyDocuments = [
  { no: "DOC-1001", name: "السجل التجاري", category: "السجل التجاري", authority: "وزارة التجارة", issue: "2023-08-19", expiry: "2026-08-19", remind: 30, status: "نشط", owner: "أ. حافظ رحيم" },
  { no: "DOC-1002", name: "البطاقة الضريبية", category: "البطاقة الضريبية", authority: "مصلحة الضرائب", issue: "2024-09-02", expiry: "2026-09-02", remind: 60, status: "نشط", owner: "قسم المالية" },
  { no: "DOC-1003", name: "شهادة القيمة المضافة", category: "شهادة ضريبة القيمة المضافة", authority: "مصلحة الضرائب", issue: "2024-01-11", expiry: "2027-01-11", remind: 30, status: "نشط", owner: "قسم المالية" },
  { no: "DOC-1004", name: "عضوية الغرفة التجارية", category: "الغرفة التجارية", authority: "الغرفة التجارية", issue: "2025-03-05", expiry: "2026-03-05", remind: 30, status: "منتهي", owner: "أ. حافظ رحيم" },
  { no: "DOC-1005", name: "رخصة الاستيراد", category: "رخصة استيراد", authority: "الهيئة العامة للرقابة", issue: "2025-06-20", expiry: "2026-06-20", remind: 90, status: "منتهي", owner: "قسم اللوجستيات" },
  { no: "DOC-1006", name: "بوليصة التأمين الطبي", category: "بوالص التأمين", authority: "شركة التأمين الوطنية", issue: "2025-09-14", expiry: "2026-09-14", remind: 30, status: "نشط", owner: "الموارد البشرية" },
  { no: "DOC-1007", name: "شهادة العلامة التجارية INT", category: "شهادات العلامات التجارية", authority: "مكتب الملكية الفكرية", issue: "2022-04-02", expiry: "2032-04-02", remind: 90, status: "نشط", owner: "أ. حافظ رحيم" },
  { no: "DOC-1008", name: "عقد إيجار المقر الرئيسي", category: "عقود الإيجار", authority: "الشهر العقاري", issue: "2024-10-01", expiry: "2026-10-01", remind: 60, status: "نشط", owner: "الإدارة العامة" },
];

export const contracts = [
  { no: "CT-2288", employee: "أحمد سالم", code: "EMP-0142", dept: "الهندسة", position: "مهندس أول", type: "عقد عمل", start: "2024-08-25", end: "2026-08-25", salary: "18,000", status: "نشط" },
  { no: "CT-2289", employee: "سارة يوسف", code: "EMP-0187", dept: "الموارد البشرية", position: "أخصائي توظيف", type: "تجديد عقد", start: "2025-01-10", end: "2027-01-10", salary: "12,500", status: "نشط" },
  { no: "CT-2290", employee: "خالد منصور", code: "EMP-0203", dept: "المالية", position: "محاسب", type: "عقد تحت التجربة", start: "2026-05-01", end: "2026-08-01", salary: "9,000", status: "منتهي" },
  { no: "CT-2291", employee: "منى عبد الله", code: "EMP-0211", dept: "التسويق", position: "مدير تسويق", type: "عقد ترقية", start: "2026-02-01", end: "2028-02-01", salary: "22,000", status: "معتمد" },
  { no: "CT-2292", employee: "طارق نبيل", code: "EMP-0219", dept: "تقنية المعلومات", position: "مسؤول شبكات", type: "اتفاقية عمل عن بعد", start: "2026-06-15", end: "2027-06-15", salary: "14,000", status: "قيد المراجعة" },
  { no: "CT-2293", employee: "ليلى حسن", code: "EMP-0224", dept: "المشتريات", position: "أخصائي مشتريات", type: "اتفاقية عدم إفصاح", start: "2026-07-01", end: "2029-07-01", salary: "—", status: "مسودة" },
];

export const contractWorkflow = ["مسودة", "قيد المراجعة", "معتمد", "موقّع", "نشط", "منتهي", "مجدد"];

export const assets = [
  { code: "AST-3301", name: "لابتوب Dell Latitude 5540", category: "لابتوب", serial: "DL5540-9921", employee: "أحمد سالم", dept: "الهندسة", assigned: "2025-03-12", expected: "—", status: "مُسندة", condition: "ممتازة" },
  { code: "AST-3302", name: "iPhone 14", category: "هاتف محمول", serial: "IP14-4410", employee: "منى عبد الله", dept: "التسويق", assigned: "2025-11-02", expected: "—", status: "مُسندة", condition: "جيدة" },
  { code: "AST-3303", name: "شاشة LG 27''", category: "شاشة", serial: "LG27-7781", employee: "—", dept: "—", assigned: "—", expected: "—", status: "متاحة", condition: "جيدة" },
  { code: "AST-3304", name: "سيارة تويوتا هايلكس", category: "مركبة", serial: "TY-HLX-2210", employee: "طارق نبيل", dept: "تقنية المعلومات", assigned: "2024-05-20", expected: "2026-08-10", status: "مُسندة", condition: "جيدة" },
  { code: "AST-3305", name: "بطاقة دخول رئيسية", category: "بطاقة دخول", serial: "ACC-0091", employee: "خالد منصور", dept: "المالية", assigned: "2026-05-01", expected: "2026-08-01", status: "بانتظار الإرجاع", condition: "—" },
  { code: "AST-3306", name: "طابعة HP LaserJet", category: "طابعة", serial: "HP-LJ-3390", employee: "—", dept: "—", assigned: "—", expected: "—", status: "صيانة", condition: "تحتاج إصلاح" },
  { code: "AST-3307", name: "توكن USB للتوقيع", category: "توكن USB", serial: "USB-TK-1120", employee: "سارة يوسف", dept: "الموارد البشرية", assigned: "2025-08-08", expected: "—", status: "مفقودة", condition: "—" },
];

export const cases = [
  { no: "CS-118", name: "نزاع تعاقدي مع مورد", type: "تجاري", opponent: "شركة الأفق للتوريدات", court: "المحكمة التجارية", firm: "مكتب الرحيم للمحاماة", lawyer: "أ. حافظ رحيم", start: "2025-11-04", hearing: "2026-08-11", value: "450,000", status: "أمام المحكمة", priority: "عالية" },
  { no: "CS-119", name: "مطالبة عمالية", type: "عمالي", opponent: "موظف سابق", court: "محكمة العمل", firm: "داخلي", lawyer: "أ. حافظ رحيم", start: "2026-02-18", hearing: "2026-09-01", value: "60,000", status: "قيد التحقيق", priority: "متوسطة" },
  { no: "CS-120", name: "تعدٍ على العلامة التجارية", type: "ملكية فكرية", opponent: "جهة غير معلومة", court: "محكمة الملكية الفكرية", firm: "مكتب النخبة", lawyer: "أ. سلمى فؤاد", start: "2026-06-30", hearing: "2026-08-20", value: "—", status: "مفتوحة", priority: "عالية" },
  { no: "CS-121", name: "تسوية إيجارية", type: "مدني", opponent: "مالك العقار", court: "المحكمة المدنية", firm: "داخلي", lawyer: "أ. حافظ رحيم", start: "2025-04-12", hearing: "—", value: "120,000", status: "مغلقة", priority: "منخفضة" },
];

export const tasks = [
  { no: "TSK-1042", title: "مراجعة عقد المورد الجديد", category: "مراجعة عقود", priority: "عالية", assignee: "أ. حافظ رحيم", due: "2026-08-02", status: "قيد التنفيذ", progress: 60 },
  { no: "TSK-1043", title: "حضور جلسة المحكمة التجارية", category: "حضور جلسات", priority: "عاجلة", assignee: "أ. حافظ رحيم", due: "2026-08-02", status: "جديدة", progress: 0 },
  { no: "TSK-1044", title: "تجديد رخصة الاستيراد", category: "تجديد تراخيص", priority: "متوسطة", assignee: "قسم اللوجستيات", due: "2026-08-06", status: "بانتظار", progress: 35 },
  { no: "TSK-1045", title: "إعداد إفادة راتب", category: "استشارة قانونية", priority: "منخفضة", assignee: "أ. سلمى فؤاد", due: "2026-08-03", status: "قيد التنفيذ", progress: 80 },
  { no: "TSK-1046", title: "تحقيق في مخالفة تأخير متكرر", category: "تحقيق موظفين", priority: "عالية", assignee: "أ. حافظ رحيم", due: "2026-07-28", status: "متأخرة", progress: 20 },
  { no: "TSK-1047", title: "مراجعة سياسة الامتثال السنوية", category: "الامتثال", priority: "متوسطة", assignee: "أ. حافظ رحيم", due: "2026-08-15", status: "مكتملة", progress: 100 },
];

export const violations = [
  { no: "VL-501", employee: "خالد منصور", dept: "المالية", type: "إنذار أول", date: "2026-06-12", decision: "خصم يوم", status: "مغلقة" },
  { no: "VL-502", employee: "طارق نبيل", dept: "تقنية المعلومات", type: "تنبيه شفهي", date: "2026-07-02", decision: "تنبيه", status: "مغلقة" },
  { no: "VL-503", employee: "موظف EMP-0230", dept: "المستودع", type: "تحقيق", date: "2026-07-25", decision: "قيد الدراسة", status: "مفتوحة" },
  { no: "VL-504", employee: "موظف EMP-0198", dept: "المبيعات", type: "إنذار نهائي", date: "2026-07-30", decision: "إيقاف 3 أيام", status: "مفتوحة" },
];

export const requests = [
  { no: "RQ-780", employee: "سارة يوسف", type: "خطاب تعريف بالراتب", date: "2026-07-29", stage: "الموارد البشرية", status: "قيد المعالجة" },
  { no: "RQ-781", employee: "أحمد سالم", type: "نسخة من العقد", date: "2026-07-30", stage: "المستشار القانوني", status: "قيد المعالجة" },
  { no: "RQ-782", employee: "منى عبد الله", type: "خطاب تأشيرة", date: "2026-08-01", stage: "المدير المباشر", status: "جديد" },
  { no: "RQ-783", employee: "خالد منصور", type: "مراجعة استقالة", date: "2026-07-20", stage: "مكتمل", status: "مكتمل" },
];

export const repository = [
  { folder: "الشركة", files: 42, size: "310 م.ب", updated: "2026-08-01" , feature: "إدارة الإصدارات" },
  { folder: "الموظفون", files: 186, size: "1.4 ج.ب", updated: "2026-08-02" , feature: "بحث OCR" },
  { folder: "العقود", files: 214, size: "980 م.ب", updated: "2026-08-02" , feature: "بحث في النص الكامل" },
  { folder: "القضايا القانونية", files: 63, size: "540 م.ب", updated: "2026-07-28" , feature: "وسوم" },
  { folder: "السياسات", files: 19, size: "70 م.ب", updated: "2026-06-11" , feature: "تصنيفات" },
  { folder: "المستندات الحكومية", files: 51, size: "220 م.ب", updated: "2026-07-19" , feature: "معاينة" },
  { folder: "العهد والأصول", files: 96, size: "180 م.ب", updated: "2026-07-30" , feature: "تنزيل" },
  { folder: "النماذج", files: 27, size: "40 م.ب", updated: "2026-05-05" , feature: "التحكم في الصلاحيات" },
  { folder: "الأرشيف", files: 402, size: "2.1 ج.ب", updated: "2026-04-02" , feature: "إدارة الإصدارات" },
];

export const contractsByMonth = [
  { month: "يناير", جديدة: 12, مجددة: 5 },
  { month: "فبراير", جديدة: 9, مجددة: 7 },
  { month: "مارس", جديدة: 15, مجددة: 4 },
  { month: "أبريل", جديدة: 11, مجددة: 9 },
  { month: "مايو", جديدة: 18, مجددة: 6 },
  { month: "يونيو", جديدة: 14, مجددة: 11 },
  { month: "يوليو", جديدة: 16, مجددة: 8 },
];

export const assetsByCategory = [
  { name: "لابتوب", value: 96 },
  { name: "هاتف محمول", value: 74 },
  { name: "شاشة", value: 58 },
  { name: "بطاقة دخول", value: 46 },
  { name: "أخرى", value: 38 },
];

export const reminderSchedule = [90, 60, 30, 15, 7, 1];

export const roles = [
  { role: "مدير النظام", perms: "صلاحية كاملة" },
  { role: "المستشار القانوني", perms: "صلاحية قانونية كاملة" },
  { role: "الموارد البشرية", perms: "الموظفون والعقود" },
  { role: "مدير القسم", perms: "عرض موظفي القسم" },
  { role: "موظف", perms: "سجلاته الخاصة فقط" },
  { role: "الإدارة التنفيذية", perms: "التقارير ولوحة المعلومات" },
  { role: "المدقق", perms: "قراءة فقط" },
];

export const auditLog = [
  { time: "2026-08-02 11:42", user: "أ. حافظ رحيم", action: "رفع مستند", target: "DOC-1001", ip: "10.0.4.18" },
  { time: "2026-08-02 10:15", user: "الموارد البشرية", action: "اعتماد عقد", target: "CT-2291", ip: "10.0.4.22" },
  { time: "2026-08-02 09:03", user: "م. سارة يوسف", action: "تسجيل دخول", target: "—", ip: "10.0.5.7" },
  { time: "2026-08-01 16:50", user: "أ. حافظ رحيم", action: "إرجاع عهدة", target: "AST-3303", ip: "10.0.4.18" },
  { time: "2026-08-01 14:11", user: "النظام", action: "نسخ احتياطي تلقائي", target: "—", ip: "—" },
];

export type ArchiveNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  size?: string;
  updatedAt: string;
  department?: string;
  category?: string;
  fileType?: string;
  owner?: string;
  version?: string;
  status?: "Active" | "Expired" | "Archived";
  confidentiality?: "Normal" | "Confidential" | "Highly Confidential";
  shared_with?: string[];
  shared_departments?: string[];
  children?: ArchiveNode[];
};

export const archiveData: ArchiveNode[] = [
  {
    id: "dept-hr",
    name: "الموارد البشرية",
    type: "folder",
    updatedAt: "2026-08-01",
    children: [
      {
        id: "hr-emp",
        name: "الموظفون",
        type: "folder",
        updatedAt: "2026-08-02",
        children: [
          {
            id: "hr-emp-001",
            name: "موظف 001",
            type: "folder",
            updatedAt: "2026-08-02",
            children: [
              {
                id: "file-contract-1",
                name: "عقد العمل.pdf",
                type: "file",
                size: "2.4 م.ب",
                updatedAt: "2026-08-02",
                department: "الموارد البشرية",
                category: "عقد",
                fileType: "PDF",
                owner: "أحمد",
                version: "V1",
                status: "Active",
                confidentiality: "Confidential",
              },
              {
                id: "file-id-1",
                name: "الهوية الوطنية.jpg",
                type: "file",
                size: "1.1 م.ب",
                updatedAt: "2026-08-01",
                department: "الموارد البشرية",
                category: "هوية",
                fileType: "Image",
                owner: "أحمد",
                version: "V1",
                status: "Active",
                confidentiality: "Highly Confidential",
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "dept-finance",
    name: "المالية",
    type: "folder",
    updatedAt: "2026-07-25",
    children: []
  },
  {
    id: "dept-legal",
    name: "الشؤون القانونية",
    type: "folder",
    updatedAt: "2026-08-05",
    children: []
  }
];

export const employeeKPIs = [
  { label: "مهام قيد التنفيذ", value: 3, icon: "listChecks", tone: "warning" },
  { label: "مستنداتي النشطة", value: 4, icon: "fileCheck", tone: "success" },
] as const;

export const employeeTasks = [
  { id: "TSK-201", title: "تحديث بيانات التأمين الطبي", priority: "عالية", status: "قيد التنفيذ", progress: 40, notes: [] as {id: string, text: string, date: string}[] },
  { id: "TSK-202", title: "مراجعة سياسة الاستخدام العادل", priority: "متوسطة", status: "جديدة", progress: 0, notes: [] as {id: string, text: string, date: string}[] },
  { id: "TSK-203", title: "التوقيع على الملحق رقم 3", priority: "عاجلة", status: "متأخرة", progress: 10, notes: [] as {id: string, text: string, date: string}[] },
];

export const employeeRequests = [
  { no: "RQ-330", type: "طلب إجازة سنوية", date: "2026-08-05", stage: "المدير المباشر", status: "قيد المعالجة" },
  { no: "RQ-321", type: "طلب سلفة طارئة", date: "2026-07-28", stage: "مكتمل", status: "مكتمل" },
];

export const employeeCustody = [
  { id: "AST-442", name: "لابتوب Dell Latitude", date: "2025-01-15", status: "مسندة" },
  { id: "AST-510", name: "بطاقة دخول للمبنى", date: "2025-01-15", status: "مسندة" },
];

