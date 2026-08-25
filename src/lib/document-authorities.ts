import { useOptionList, type OptionListApi } from "@/lib/option-lists";

export const baseDocumentAuthorities = [
  "وزارة التجارة",
  "مصلحة الضرائب",
  "الغرفة التجارية",
  "الهيئة العامة للرقابة على الصادرات والواردات",
  "شركة التأمين الوطنية",
  "مكتب الملكية الفكرية",
  "الشهر العقاري",
  "وزارة العمل",
  "التأمينات الاجتماعية",
  "الهيئة العامة للاستثمار",
  "أمانة المنطقة / البلدية",
  "وزارة الداخلية",
];

export const DOCUMENT_AUTHORITY_KEY = "document-authorities";

export type DocumentAuthoritiesApi = OptionListApi;

export function useDocumentAuthorities(): DocumentAuthoritiesApi {
  return useOptionList(DOCUMENT_AUTHORITY_KEY, baseDocumentAuthorities);
}
