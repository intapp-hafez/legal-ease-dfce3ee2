import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Panel } from "@/components/legal/PageShell";
import { hrSupabase } from "@/lib/hr-supabase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { formatDate } from "@/lib/date-utils";
import { useFieldPermissions } from "@/lib/field-permissions";

// ─── helpers ────────────────────────────────────────────────────────────────
const getRemainingDays = (dateStr: string | null) => {
  if (!dateStr) return null;
  const diffTime = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const renderRemaining = (days: number | null) => {
  if (days === null) return <span className="text-muted-foreground/50">—</span>;
  if (days < 0)
    return <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-xs">⚠ منتهي (قبل {Math.abs(days)} يوم)</span>;
  if (days < 30)
    return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-xs">⏳ متبقي {days} يوم</span>;
  return <span className="text-muted-foreground text-xs">متبقي {days} يوم</span>;
};

const fmtDate = (d: string | null) => formatDate(d);

// ─── component ───────────────────────────────────────────────────────────────
export function EmployeesTab() {
  const router = useRouter();
  const { canView } = useFieldPermissions();
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // text search
  const [searchName, setSearchName] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [searchNationalId, setSearchNationalId] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  // dropdown filters
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterInsured, setFilterInsured] = useState("all");
  const [filterContractType, setFilterContractType] = useState("all");
  const [filterContractDate, setFilterContractDate] = useState("all");
  const [filterIdDate, setFilterIdDate] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");

  const [pageSize, setPageSize] = useState(20);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const hasActiveFilters =
    searchName || searchCode || searchNationalId || searchPhone ||
    filterRole !== "all" || filterStatus !== "all" || filterGender !== "all" ||
    filterInsured !== "all" || filterContractType !== "all" ||
    filterContractDate !== "all" || filterIdDate !== "all" ||
    filterDepartment !== "all" || filterPosition !== "all" ||
    filterCity !== "all" || filterDistrict !== "all";

  const resetFilters = () => {
    setPage(1);
    setSearchName(""); setSearchCode(""); setSearchNationalId(""); setSearchPhone("");
    setFilterRole("all"); setFilterStatus("all"); setFilterGender("all");
    setFilterInsured("all"); setFilterContractType("all");
    setFilterContractDate("all"); setFilterIdDate("all");
    setFilterDepartment("all"); setFilterPosition("all");
    setFilterCity("all"); setFilterDistrict("all");
  };

  const handleFilterChange = (setter: any, val: string) => {
    setter(val);
    setPage(1);
  };

  // ── lookup queries ──
  const { data: depsData } = useQuery({
    queryKey: ["hr-departments"],
    queryFn: async () => {
      const res = await hrSupabase.from("departments").select("id, name_ar, name_en").eq("active", true).order("sort_order");
      return res.data || [];
    },
  });

  const { data: posData } = useQuery({
    queryKey: ["hr-positions"],
    queryFn: async () => {
      const res = await hrSupabase.from("positions").select("id, name_ar, name_en").eq("active", true).order("sort_order");
      return res.data || [];
    },
  });

  const { data: citiesData } = useQuery({
    queryKey: ["hr-cities"],
    queryFn: async () => {
      const res = await hrSupabase.from("cities").select("id, name_ar, name_en").order("name_ar");
      return res.data || [];
    },
  });

  const { data: districtsData } = useQuery({
    queryKey: ["hr-districts"],
    queryFn: async () => {
      const res = await hrSupabase.from("districts").select("id, city_id, name_ar, name_en").order("name_ar");
      return res.data || [];
    },
  });

  const filteredDistricts = (districtsData || []).filter(
    (d: any) => filterCity === "all" || d.city_id === filterCity
  );

  // ── main data query ──
  const { data, isLoading, error } = useQuery({
    queryKey: ["hr-profiles", page, pageSize, searchName, searchCode, searchNationalId, searchPhone,
      filterRole, filterStatus, filterGender, filterInsured, filterContractType,
      filterContractDate, filterIdDate, filterDepartment, filterPosition, filterCity, filterDistrict],
    queryFn: async () => {
      let q = hrSupabase
        .from("profiles")
        .select("*, departments!profiles_department_id_fkey(*), positions(*), cities!profiles_city_id_fkey(*), districts!profiles_district_id_fkey(*)", { count: "exact" });

      if (searchName) q = q.ilike("full_name", `%${searchName}%`);
      if (searchCode) q = q.ilike("emp_code", `%${searchCode}%`);
      if (searchNationalId) q = q.ilike("national_id", `%${searchNationalId}%`);
      if (searchPhone) q = q.ilike("phone", `%${searchPhone}%`);
      if (filterRole !== "all") q = q.eq("role", filterRole);
      if (filterStatus !== "all") q = q.eq("status", filterStatus);
      if (filterGender !== "all") q = q.eq("gender", filterGender);
      if (filterInsured === "yes") q = q.eq("is_insured", true);
      else if (filterInsured === "no") q = q.eq("is_insured", false);
      if (filterContractType !== "all") q = q.eq("contract_type", filterContractType);
      if (filterDepartment !== "all") q = q.eq("department_id", filterDepartment);
      if (filterPosition !== "all") q = q.eq("position_id", filterPosition);
      if (filterCity !== "all") q = q.eq("city_id", filterCity);
      if (filterDistrict !== "all") q = q.eq("district_id", filterDistrict);

      const now = new Date().toISOString();
      const soon = new Date(Date.now() + 30 * 86400000).toISOString();

      if (filterContractDate === "expired") q = q.lte("contract_end_date", now);
      else if (filterContractDate === "expiring_soon") q = q.gte("contract_end_date", now).lte("contract_end_date", soon);
      else if (filterContractDate === "valid") q = q.gt("contract_end_date", soon);

      if (filterIdDate === "expired") q = q.lte("id_expiry_date", now);
      else if (filterIdDate === "expiring_soon") q = q.gte("id_expiry_date", now).lte("id_expiry_date", soon);
      else if (filterIdDate === "valid") q = q.gt("id_expiry_date", soon);

      q = q.range(from, to).order("created_at", { ascending: false });
      const res = await q;
      if (res.error) throw new Error(res.error.message);
      return { data: res.data || [], count: res.count || 0 };
    },
  });

  const employees = data?.data || [];

  // ── Excel export (Permission-aware) ──
  const exportToExcel = () => {
    const rows = employees.map((emp: any) => {
      const r: Record<string, any> = {
        "الاسم": emp.full_name || emp.name || "",
      };
      if (canView("position_id")) r["المسمى الوظيفي"] = emp.positions?.name_ar || emp.positions?.name_en || "";
      if (canView("department_id")) r["القسم"] = emp.departments?.name_ar || emp.departments?.name_en || "";
      if (canView("emp_code")) r["الرقم الوظيفي"] = emp.emp_code || "";
      if (canView("national_id")) r["الرقم القومي"] = emp.national_id || "";
      if (canView("city_id")) r["المدينة"] = emp.cities?.name_ar || emp.cities?.name_en || "";
      if (canView("district_id")) r["الحي"] = emp.districts?.name_ar || emp.districts?.name_en || "";
      if (canView("email")) r["البريد الإلكتروني"] = emp.email || "";
      if (canView("phone")) r["الهاتف"] = emp.phone || "";
      if (canView("role")) r["الدور"] = emp.role || "";
      if (canView("gender")) r["الجنس"] = emp.gender === "male" ? "ذكر" : emp.gender === "female" ? "أنثى" : "";
      if (canView("is_insured")) r["مؤمن عليه"] = emp.is_insured ? "نعم" : "لا";
      if (canView("contract_type")) r["نوع العقد"] = emp.contract_type || "";
      if (canView("contract_start_date")) r["بداية العقد"] = fmtDate(emp.contract_start_date);
      if (canView("contract_end_date")) {
        r["نهاية العقد"] = fmtDate(emp.contract_end_date);
        r["أيام متبقية (العقد)"] = getRemainingDays(emp.contract_end_date) ?? "";
      }
      if (canView("id_issue_date")) r["إصدار الهوية"] = fmtDate(emp.id_issue_date);
      if (canView("id_expiry_date")) {
        r["انتهاء الهوية"] = fmtDate(emp.id_expiry_date);
        r["أيام متبقية (الهوية)"] = getRemainingDays(emp.id_expiry_date) ?? "";
      }
      if (canView("salary_amount")) r["قيمة الراتب"] = emp.salary_amount ?? "";
      if (canView("salary_type")) r["نوع الراتب"] = emp.salary_type || "";
      if (canView("insurance_number")) r["الرقم التأميني"] = emp.insurance_number || "";
      if (canView("bank_account_number")) r["الحساب البنكي"] = emp.bank_account_number || "";
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الموظفين");
    XLSX.writeFile(wb, `employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── filter select helper ──
  const Sel = ({ value, onChange, placeholder, children }: any) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger dir="rtl" className="h-9 text-sm bg-background border-border/70 hover:border-primary/50 transition-colors">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {children}
      </SelectContent>
    </Select>
  );

  return (
    <Panel title="دليل الموظفين (النظام الخارجي HR)" className="mt-5">

      {/* ── Filter Panel ── */}
      <div className="rounded-xl border border-border/60 bg-muted/30 mb-5" dir="rtl">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span className="text-sm font-semibold text-foreground">فلاتر البحث</span>
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                نشط
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                title="مسح الفلاتر"
                className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-medium transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                مسح الفلاتر
              </button>
            )}
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
            >
              <svg className={`w-4 h-4 transition-transform ${filtersOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="p-4 space-y-3.5">
            {/* Row 1: Text Search */}
            <div className="flex flex-col md:flex-row md:items-center gap-2.5 pb-3 border-b border-border/30 last:border-b-0 last:pb-0">
              <div className="w-32 shrink-0 text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <span>🔍</span> <span>بحث نصي</span>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Input placeholder="بحث بالاسم..." value={searchName} onChange={e => handleFilterChange(setSearchName, e.target.value)} className="h-9 text-sm" />
                <Input placeholder="الرقم الوظيفي..." value={searchCode} onChange={e => handleFilterChange(setSearchCode, e.target.value)} className="h-9 text-sm" />
                <Input placeholder="الرقم القومي..." value={searchNationalId} onChange={e => handleFilterChange(setSearchNationalId, e.target.value)} className="h-9 text-sm" />
                <Input placeholder="رقم الهاتف..." value={searchPhone} onChange={e => handleFilterChange(setSearchPhone, e.target.value)} className="h-9 text-sm" dir="ltr" />
              </div>
            </div>

            {/* Row 2: Employee Attributes */}
            <div className="flex flex-col md:flex-row md:items-center gap-2.5 pb-3 border-b border-border/30 last:border-b-0 last:pb-0">
              <div className="w-32 shrink-0 text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <span>👤</span> <span>بيانات الموظف</span>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <Sel value={filterRole} onChange={(v: string) => handleFilterChange(setFilterRole, v)} placeholder="الصلاحية">
                  <SelectItem value="all">كل الصلاحيات</SelectItem>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="admin">مسؤول</SelectItem>
                </Sel>
                <Sel value={filterStatus} onChange={(v: string) => handleFilterChange(setFilterStatus, v)} placeholder="الحالة">
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="Active">نشط</SelectItem>
                  <SelectItem value="Inactive">غير نشط</SelectItem>
                  <SelectItem value="On Leave">في إجازة</SelectItem>
                </Sel>
                <Sel value={filterGender} onChange={(v: string) => handleFilterChange(setFilterGender, v)} placeholder="الجنس">
                  <SelectItem value="all">كل الجنسين</SelectItem>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </Sel>
                <Sel value={filterInsured} onChange={(v: string) => handleFilterChange(setFilterInsured, v)} placeholder="التأمين">
                  <SelectItem value="all">التأمين (الكل)</SelectItem>
                  <SelectItem value="yes">مؤمن عليه ✓</SelectItem>
                  <SelectItem value="no">غير مؤمن ✗</SelectItem>
                </Sel>
                <Sel value={filterContractType} onChange={(v: string) => handleFilterChange(setFilterContractType, v)} placeholder="نوع العقد">
                  <SelectItem value="all">نوع العقد (الكل)</SelectItem>
                  <SelectItem value="FullTime">دوام كامل</SelectItem>
                  <SelectItem value="PartTime">دوام جزئي</SelectItem>
                  <SelectItem value="Contract">عقد مؤقت</SelectItem>
                  <SelectItem value="Freelance">عمل حر</SelectItem>
                  <SelectItem value="Remote">عن بعد</SelectItem>
                </Sel>
              </div>
            </div>

            {/* Row 3: Org + Location */}
            <div className="flex flex-col md:flex-row md:items-center gap-2.5 pb-3 border-b border-border/30 last:border-b-0 last:pb-0">
              <div className="w-32 shrink-0 text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <span>🏢</span> <span>الهيكل والموقع</span>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Sel value={filterDepartment} onChange={(v: string) => handleFilterChange(setFilterDepartment, v)} placeholder="القسم / الإدارة">
                  <SelectItem value="all">كل الأقسام</SelectItem>
                  {depsData?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name_ar || d.name_en}</SelectItem>)}
                </Sel>
                <Sel value={filterPosition} onChange={(v: string) => handleFilterChange(setFilterPosition, v)} placeholder="المسمى الوظيفي">
                  <SelectItem value="all">كل الوظائف</SelectItem>
                  {posData?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name_ar || p.name_en}</SelectItem>)}
                </Sel>
                <Sel value={filterCity} onChange={(v: string) => { handleFilterChange(setFilterCity, v); setFilterDistrict("all"); }} placeholder="المدينة">
                  <SelectItem value="all">كل المدن</SelectItem>
                  {citiesData?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name_ar || c.name_en}</SelectItem>)}
                </Sel>
                <Sel value={filterDistrict} onChange={(v: string) => handleFilterChange(setFilterDistrict, v)} placeholder="الحي">
                  <SelectItem value="all">كل الأحياء</SelectItem>
                  {filteredDistricts.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name_ar || d.name_en}</SelectItem>)}
                </Sel>
              </div>
            </div>

            {/* Row 4: Date filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-2.5">
              <div className="w-32 shrink-0 text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <span>📅</span> <span>حالة التواريخ</span>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Sel value={filterContractDate} onChange={(v: string) => handleFilterChange(setFilterContractDate, v)} placeholder="حالة العقد">
                  <SelectItem value="all">حالة العقد (الكل)</SelectItem>
                  <SelectItem value="valid">ساري ✓</SelectItem>
                  <SelectItem value="expiring_soon">ينتهي قريباً ⏳</SelectItem>
                  <SelectItem value="expired">منتهي ✗</SelectItem>
                </Sel>
                <Sel value={filterIdDate} onChange={(v: string) => handleFilterChange(setFilterIdDate, v)} placeholder="حالة الهوية">
                  <SelectItem value="all">حالة الهوية (الكل)</SelectItem>
                  <SelectItem value="valid">سارية ✓</SelectItem>
                  <SelectItem value="expiring_soon">تنتهي قريباً ⏳</SelectItem>
                  <SelectItem value="expired">منتهية ✗</SelectItem>
                </Sel>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar: count + export ── */}
      <div className="flex items-center justify-between mb-3" dir="rtl">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">إجمالي الموظفين:</span>
          <span className="text-sm font-bold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
            {data?.count ?? "…"}
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">(مفلترة)</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToExcel}
          disabled={employees.length === 0}
          className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          تصدير Excel
        </Button>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل بيانات الموظفين...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-destructive font-medium bg-destructive/10 rounded-xl border border-destructive/20 p-6">
          <p className="font-semibold mb-1">حدث خطأ أثناء جلب البيانات</p>
          <p className="text-muted-foreground text-xs mt-1">{(error as Error).message}</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/60 overflow-hidden" dir="rtl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-right text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">الاسم</th>
                    {canView("is_insured") && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">مؤمن؟</th>}
                    {canView("emp_code") && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">الرقم الوظيفي</th>}
                    {canView("national_id") && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">الرقم القومي</th>}
                    {(canView("city_id") || canView("district_id")) && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">المدينة / الحي</th>}
                    {(canView("email") || canView("phone")) && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">التواصل</th>}
                    {canView("role") && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">الدور</th>}
                    {canView("contract_end_date") && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">نهاية العقد</th>}
                    {canView("id_expiry_date") && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">انتهاء الهوية</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {employees.map((emp: any, idx: number) => {
                    const contractDays = getRemainingDays(emp.contract_end_date);
                    const idDays = getRemainingDays(emp.id_expiry_date);
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => router.navigate({ to: `/employee/${emp.id}` as any })}
                        className={`transition-colors cursor-pointer hover:bg-primary/5 ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                        title="انقر لعرض صفحة تفاصيل الموظف"
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {emp.avatar_url ? (
                              <img
                                src={emp.avatar_url}
                                alt={emp.full_name || "avatar"}
                                className="w-8 h-8 rounded-full object-cover border border-border/80 shadow-xs shrink-0"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                                {emp.full_name ? emp.full_name.trim().charAt(0) : "م"}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-foreground leading-tight hover:text-primary transition-colors">{emp.full_name || emp.name || "—"}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {[
                                  canView("position_id") && emp.positions?.name_ar,
                                  canView("department_id") && emp.departments?.name_ar
                                ].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Insured */}
                        {canView("is_insured") && (
                          <td className="px-4 py-3">
                            {emp.is_insured
                              ? <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-xs font-semibold px-2 py-0.5 rounded-full">✓ نعم</span>
                              : <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted text-xs px-2 py-0.5 rounded-full">✗ لا</span>
                            }
                          </td>
                        )}
                        {/* Emp Code */}
                        {canView("emp_code") && (
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{emp.emp_code || "—"}</td>
                        )}
                        {/* National ID */}
                        {canView("national_id") && (
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{emp.national_id || "—"}</td>
                        )}
                        {/* City / District */}
                        {(canView("city_id") || canView("district_id")) && (
                          <td className="px-4 py-3">
                            {canView("city_id") && (
                              <div className="text-xs text-foreground">{(emp as any).cities?.name_ar || (emp as any).cities?.name_en || "—"}</div>
                            )}
                            {canView("district_id") && (emp as any).districts && (
                              <div className="text-xs text-muted-foreground mt-0.5">{(emp as any).districts?.name_ar || (emp as any).districts?.name_en}</div>
                            )}
                          </td>
                        )}
                        {/* Contact */}
                        {(canView("email") || canView("phone")) && (
                          <td className="px-4 py-3">
                            {canView("email") && <div className="text-xs text-foreground">{emp.email || "—"}</div>}
                            {canView("phone") && emp.phone && (
                              <div className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{emp.phone}</div>
                            )}
                          </td>
                        )}
                        {/* Role */}
                        {canView("role") && (
                          <td className="px-4 py-3">
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">{emp.role || "—"}</span>
                          </td>
                        )}
                        {/* Contract End */}
                        {canView("contract_end_date") && (
                          <td className={`px-4 py-3 ${contractDays !== null && contractDays < 0 && emp.contract_end_date ? "bg-red-50 dark:bg-red-950/20" : contractDays !== null && contractDays < 30 && emp.contract_end_date ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                            {renderRemaining(contractDays)}
                            {emp.contract_end_date && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{fmtDate(emp.contract_end_date)}</div>}
                          </td>
                        )}
                        {/* ID Expiry */}
                        {canView("id_expiry_date") && (
                          <td className={`px-4 py-3 ${idDays !== null && idDays < 0 && emp.id_expiry_date ? "bg-red-50 dark:bg-red-950/20" : idDays !== null && idDays < 30 && emp.id_expiry_date ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                            {renderRemaining(idDays)}
                            {emp.id_expiry_date && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{fmtDate(emp.id_expiry_date)}</div>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm font-medium">لا يوجد موظفون بهذه المعايير</p>
                          {hasActiveFilters && (
                            <button onClick={resetFilters} className="text-xs text-primary underline">مسح الفلاتر</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4" dir="rtl">
            <p className="text-xs text-muted-foreground">
              عرض {from + 1}–{Math.min(to + 1, data?.count || 0)} من {data?.count || 0}
            </p>
            <div className="flex items-center gap-2">
              {/* Rows per page */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>صفوف لكل صفحة:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={v => { setPageSize(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="h-7 w-20 text-xs border-border/60" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {[10, 15, 20, 25, 50, 100, 250, 500].map(n => (
                      <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-px h-5 bg-border/60" />
              {/* Page nav */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  ← السابق
                </Button>
                <div className="px-4 py-1.5 text-sm font-semibold bg-primary/10 text-primary rounded-md min-w-[80px] text-center">
                  صفحة {page} / {data?.count ? Math.ceil(data.count / pageSize) : 1}
                </div>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={employees.length < pageSize}>
                  التالي →
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
