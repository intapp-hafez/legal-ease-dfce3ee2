import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { useOptionList } from "@/lib/option-lists";
import { useProfilesOptions } from "@/lib/useSupabase";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const baseCaseTypes = ["تجاري", "عمالي", "مدني", "جنائي", "إداري", "ملكية فكرية"];

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "القضايا القانونية — نظام INT القانوني" },
      {
        name: "description",
        content: "متابعة القضايا والمحاكم والجلسات القادمة والقيمة المالية لكل قضية.",
      },
      { property: "og:title", content: "القضايا القانونية — نظام INT" },
      { property: "og:description", content: "متابعة القضايا والجلسات والمحامين المكلّفين." },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  const { options: caseTypes, add: addCaseType } = useOptionList("case-types", baseCaseTypes);
  const profilesOptions = useProfilesOptions();

  const { data: stats } = useQuery({
    queryKey: ["cases-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("cases").select("*");
      if (!data) return { open: 0, court: 0, hearings: 0, value: 0 };
      
      const open = data.filter((c: any) => c.status !== "مغلقة" && c.status !== "مؤرشف").length;
      const court = data.filter((c: any) => c.status === "أمام المحكمة").length;
      const hearings = data.filter((c: any) => c.hearing_date && new Date(c.hearing_date).getMonth() === new Date().getMonth()).length;
      const value = data.reduce((acc: number, c: any) => acc + (Number(c.value) || 0), 0);
      
      return { open, court, hearings, value };
    }
  });

  const statValues = stats || { open: 0, court: 0, hearings: 0, value: 0 };

  return (
    <PageShell
      title="القضايا القانونية"
      description="متابعة القضايا المرفوعة من الشركة أو ضدها — إضافة وتعديل وحذف."
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "قضايا مفتوحة", value: statValues.open },
          { label: "أمام المحكمة", value: statValues.court },
          { label: "جلسات هذا الشهر", value: statValues.hearings },
          { label: "إجمالي القيمة المالية", value: statValues.value.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="font-display text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <CrudTable
        title="سجل القضايا"
        addLabel="قضية جديدة"
        storageKey="cases"
        tableName="cases"
        seed={[]}
        idKey="no"
        idPrefix="CS-"
        fields={[
          { key: "no", label: "رقم القضية", type: "mono", required: true },
          { key: "name", label: "الاسم", required: true },
          {
            key: "type",
            label: "النوع",
            type: "select",
            options: caseTypes,
            onAddOption: addCaseType,
            addLabel: "إضافة نوع جديد",
          },
          { key: "opponent", label: "الخصم" },
          { key: "court", label: "المحكمة" },
          { key: "firm", label: "مكتب المحاماة" },
          { key: "lawyer_id", label: "المحامي", type: "select", options: profilesOptions },
          { key: "start_date", label: "البداية", type: "date" },
          { key: "hearing_date", label: "الجلسة القادمة", type: "date" },
          { key: "value", label: "القيمة", type: "number" },
          {
            key: "priority",
            label: "الأولوية",
            type: "select",
            options: ["منخفضة", "متوسطة", "عالية", "عاجلة"],
          },
          {
            key: "status",
            label: "الحالة",
            type: "status",
            options: ["مفتوحة", "قيد التحقيق", "أمام المحكمة", "مغلقة", "مؤرشف"],
          },
        ]}
      />
    </PageShell>
  );
}
