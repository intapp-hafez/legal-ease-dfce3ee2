import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart, Download } from "lucide-react";
import { PageShell, Panel } from "@/components/legal/PageShell";

const groups = [
  {
    title: "تقارير الموظفين",
    items: ["عقود الموظفين", "العقود التي تنتهي قريبًا", "العقود المنتهية"],
  },
  {
    title: "تقارير الشركة",
    items: ["مستندات الشركة", "المستندات التي تنتهي قريبًا", "التجديدات"],
  },
  {
    title: "تقارير العهد",
    items: ["العهد المسندة", "العهد المُرجعة", "العهد المفقودة", "العهد التالفة"],
  },
  {
    title: "التقارير القانونية",
    items: [
      "القضايا القانونية",
      "المخالفات",
      "المهام اليومية",
      "إنتاجية المستشار القانوني",
      "التجديدات القادمة",
    ],
  },
];

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير القانونية — نظام INT القانوني" },
      {
        name: "description",
        content: "تقارير جاهزة عن العقود والمستندات والعهد والقضايا وإنتاجية الإدارة القانونية.",
      },
      { property: "og:title", content: "التقارير القانونية — نظام INT" },
      { property: "og:description", content: "تقارير العقود والعهد والقضايا والتجديدات." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <PageShell
      title="التقارير"
      description="توليد وتصدير التقارير القانونية والإدارية بصيغ PDF و Excel."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.title} title={g.title}>
            <ul className="space-y-2">
              {g.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    <FileBarChart className="size-4 text-[var(--accent-ink)]" />
                    {item}
                  </span>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
                    <Download className="size-3.5" /> تصدير
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}
