import { useOptionList, type OptionListApi } from "@/lib/option-lists";

export const baseDocumentCategories = [
  "السجل التجاري",
  "البطاقة الضريبية",
  "شهادة ضريبة القيمة المضافة",
  "الغرفة التجارية",
  "رخصة استيراد",
  "رخصة تصدير",
  "بوالص التأمين",
  "شهادات العلامات التجارية",
  "سياسات الشركة",
  "عقود الإيجار",
  "التراخيص الحكومية",
  "نماذج عدم الإفصاح",
  "اتفاقيات الشراكة",
  "عقود الموردين",
  "عقود العملاء",
  "مستندات قانونية داخلية",
];

export const DOCUMENT_CATEGORY_KEY = "document-categories";

export type DocumentCategoriesApi = OptionListApi;

export function useDocumentCategories(): DocumentCategoriesApi {
  return useOptionList(DOCUMENT_CATEGORY_KEY, baseDocumentCategories);
}
