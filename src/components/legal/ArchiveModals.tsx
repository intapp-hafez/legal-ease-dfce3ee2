import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { X, UploadCloud, FolderPlus, File as FileIcon, Scan, Loader2 } from "lucide-react";

export function CreateFolderModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-card-foreground">مجلد جديد</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">اسم المجلد</label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="مثال: الموظفون 2026"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary">
            إلغاء
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSubmit(name.trim());
                setName("");
              }
            }}
            disabled={!name.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <FolderPlus className="size-4" /> إنشاء
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocumentUploadModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [fileType, setFileType] = useState("");
  const [employee, setEmployee] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [shareWith, setShareWith] = useState("");
  const [sharedEmployee, setSharedEmployee] = useState("");
  const [sharedDepartment, setSharedDepartment] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { user } = useAuth();

  if (!open) return null;

  const handleScanDocument = () => {
    setIsScanning(true);
    setTimeout(() => {
      const content = new Blob(["Scanned Document Content"], { type: "application/pdf" });
      const scannedFile = new File([content], `Scanned_Document_${Math.floor(Math.random() * 1000)}.pdf`, { type: "application/pdf" });
      setFiles((prev) => [...prev, scannedFile]);
      setIsScanning(false);
    }, 2500);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-lg my-auto">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-card-foreground">رفع مستندات جديدة</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* File Upload Zone */}
          <div className="col-span-full">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">المستندات (السحب والإفلات متاح)</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="flex flex-1 min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 transition-colors hover:bg-secondary/60 p-4"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <UploadCloud className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">اختر الملفات أو اسحبها هنا</p>
                <p className="mt-1 text-xs text-muted-foreground">يدعم PDF, Word, Excel, صور</p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </div>

              <div 
                onClick={isScanning ? undefined : handleScanDocument}
                className={`flex sm:w-[180px] min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-card transition-colors p-4 ${isScanning ? "opacity-70 cursor-not-allowed" : "hover:bg-secondary"}`}
              >
                {isScanning ? (
                  <Loader2 className="mb-2 size-8 text-primary animate-spin" />
                ) : (
                  <Scan className="mb-2 size-8 text-primary" />
                )}
                <p className="text-sm font-medium text-foreground text-center">
                  {isScanning ? "جاري المسح..." : "المسح الضوئي"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground text-center">
                  سحب من الماسحة
                </p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5">
                    <div className="flex items-center gap-3">
                      <FileIcon className="size-4 text-blue-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="col-span-full">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              اسم المستند <span className="text-red-500">*</span>
            </label>
            <input type="text" value={documentName} onChange={(e) => setDocumentName(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="أدخل اسم المستند..." />
          </div>


          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">القسم المختص</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none">
              <option value="">اختر القسم...</option>
              <option value="الموارد البشرية">الموارد البشرية</option>
              <option value="المالية">المالية</option>
              <option value="الشؤون القانونية">الشؤون القانونية</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">تصنيف المستند</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none">
              <option value="">اختر التصنيف...</option>
              <option value="عام">عام</option>
              <option value="سري">سري</option>
              <option value="سري للغاية">سري للغاية</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">نوع الملف</label>
            <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none">
              <option value="">اختر النوع...</option>
              <option value="عقد">عقد</option>
              <option value="رخصة">رخصة</option>
              <option value="تقرير">تقرير</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">حفظ في المجلد</label>
            <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
              <option value="">اختر المجلد الوجهة...</option>
              <option value="الرئيسية">الرئيسية</option>
              <option value="عقود الموظفين">عقود الموظفين</option>
              <option value="ملفات القضايا">ملفات القضايا</option>
              <option value="الرخص والسجلات">الرخص والسجلات</option>
              <option value="القرارات الإدارية">القرارات الإدارية</option>
            </select>
          </div>

          {user?.role !== "employee" && (
            <div className="col-span-full md:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">الموظف المرتبط (اختياري)</label>
              <select value={employee} onChange={(e) => setEmployee(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none">
                <option value="">اختر الموظف...</option>
                <option value="أحمد محمد">أحمد محمد</option>
                <option value="سارة أحمد">سارة أحمد</option>
                <option value="خالد عبدالله">خالد عبدالله</option>
              </select>
            </div>
          )}

          <div className="col-span-full flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">تاريخ الإصدار</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
            </div>

            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">تاريخ الانتهاء</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
            </div>
          </div>

          <div className="col-span-full">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">المشاركة مع</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={shareWith} 
                onChange={(e) => {
                  setShareWith(e.target.value);
                  setSharedEmployee("");
                  setSharedDepartment("");
                }} 
                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none"
              >
                <option value="">اختر صلاحية المشاركة...</option>
                <option value="موظف">موظف محدد</option>
                <option value="قسم">قسم محدد</option>
                <option value="الجميع">الجميع</option>
              </select>

              {shareWith === "موظف" && (
                <select value={sharedEmployee} onChange={(e) => setSharedEmployee(e.target.value)} className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none animate-in fade-in zoom-in-95">
                  <option value="">اختر الموظف...</option>
                  <option value="أحمد محمد">أحمد محمد</option>
                  <option value="سارة أحمد">سارة أحمد</option>
                  <option value="خالد عبدالله">خالد عبدالله</option>
                </select>
              )}

              {shareWith === "قسم" && (
                <select value={sharedDepartment} onChange={(e) => setSharedDepartment(e.target.value)} className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none animate-in fade-in zoom-in-95">
                  <option value="">اختر القسم...</option>
                  <option value="الموارد البشرية">الموارد البشرية</option>
                  <option value="المالية">المالية</option>
                  <option value="الشؤون القانونية">الشؤون القانونية</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border px-5 py-2 text-sm text-foreground hover:bg-secondary">
            إلغاء
          </button>
          <button
            onClick={() => {
              if (files.length > 0 && documentName.trim()) {
                onSubmit({ files, documentName, selectedFolder, department, category, fileType, employee, issueDate, expiryDate, shareWith, sharedEmployee, sharedDepartment });
                setFiles([]);
              }
            }}
            disabled={files.length === 0 || !documentName.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <UploadCloud className="size-4" /> رفع المستندات
          </button>
        </div>
      </div>
    </div>
  );
}

export function ArchiveSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-card-foreground">إعدادات الأرشيف</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Storage Section - Full Width */}
          <div className="rounded-lg border border-border p-4 bg-secondary/20">
            <div className="flex justify-between mb-2">
              <h4 className="text-sm font-semibold">مساحة التخزين (Storage Quota)</h4>
              <span className="text-xs font-medium text-primary">45% مستخدم</span>
            </div>
            <div className="mb-2 h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "45%" }}></div>
            </div>
            <p className="text-xs text-muted-foreground">تم استخدام 45 جيجابايت من أصل 100 جيجابايت</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Expiry Notifications */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold mb-2">إشعارات انتهاء الصلاحية</h4>
              <p className="text-xs text-muted-foreground mb-3">تنبيه قبل انتهاء صلاحية المستند بـ:</p>
              <div className="flex flex-wrap gap-2">
                {["90 يوم", "60 يوم", "30 يوم", "15 يوم", "7 أيام", "يوم واحد"].map(d => (
                  <label key={d} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary cursor-pointer">
                    <input type="checkbox" className="rounded text-primary" defaultChecked={["30 يوم", "7 أيام"].includes(d)} />
                    <span>{d}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Versioning & Limits */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">سياسة الاحتفاظ بالنسخ (Versioning)</h4>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option>الاحتفاظ بجميع النسخ السابقة</option>
                  <option>الاحتفاظ بآخر 5 نسخ فقط</option>
                  <option>الاحتفاظ بآخر 3 نسخ فقط</option>
                  <option>عدم الاحتفاظ بأي نسخ (استبدال دائم)</option>
                </select>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2">الحد الأقصى لحجم الملف</h4>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option>5 ميجابايت</option>
                  <option>10 ميجابايت</option>
                  <option>25 ميجابايت</option>
                  <option>50 ميجابايت</option>
                  <option>100 ميجابايت</option>
                </select>
              </div>
            </div>

            {/* Default Access & Categories */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">الصلاحية الافتراضية للمستندات</h4>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option>خاص (منشئ المستند فقط)</option>
                  <option>القسم المختص فقط</option>
                  <option>جميع الموظفين</option>
                </select>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2">جدولة النسخ الاحتياطي (Backup)</h4>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option>يومي (منتصف الليل)</option>
                  <option>أسبوعي (يوم الجمعة)</option>
                  <option>شهري (أول يوم من الشهر)</option>
                </select>
              </div>
            </div>
            
            {/* AI & Automation */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">الأرشفة التلقائية</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">نقل المستندات المنتهية صلاحيتها إلى الأرشيف التلقائي بعد 30 يوماً.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="h-5 w-9 rounded-full bg-secondary peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              <div className="h-px w-full bg-border"></div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">استخراج النصوص الذكي (OCR)</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">قراءة محتوى الصور والـ PDF تلقائياً لجعلها قابلة للبحث.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="h-5 w-9 rounded-full bg-secondary peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            {/* Security & DLP */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">تشفير البيانات (E2EE)</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">تشفير المستندات بالكامل بحيث لا يمكن قراءتها إلا للمصرح لهم.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="h-5 w-9 rounded-full bg-secondary peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              <div className="h-px w-full bg-border"></div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">منع التحميل والطباعة (DLP)</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">منع الموظفين من تحميل أو طباعة المستندات السرية.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-secondary peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            {/* Watermark & Audit Log */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">العلامة المائية الافتراضية (Watermark)</h4>
                <input type="text" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary" defaultValue="سري للغاية - نسخة غير قابلة للتداول" placeholder="نص العلامة المائية..." />
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2">الاحتفاظ بسجل النشاطات (Audit Log)</h4>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option>٦ أشهر</option>
                  <option>سنة واحدة</option>
                  <option>٣ سنوات</option>
                  <option>الاحتفاظ الدائم</option>
                </select>
              </div>
            </div>

            {/* Default Categories - Full Width in Grid */}
            <div className="col-span-full rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold mb-2">التصنيفات الافتراضية السريعة</h4>
              <textarea className="w-full h-24 rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-1 focus:ring-primary" defaultValue={"عقود تجارية\nمذكرات قانونية\nمحاضر جلسات\nتراخيص وسجلات\nخطابات رسمية"} />
              <p className="mt-1 text-xs text-muted-foreground">اكتب كل تصنيف في سطر منفصل لتظهر كخيارات سريعة أثناء الرفع.</p>
            </div>

          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
          <button onClick={onClose} className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            إلغاء
          </button>
          <button onClick={onClose} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
}
