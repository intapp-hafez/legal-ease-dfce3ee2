import { useOptionList, type OptionListApi } from "@/lib/option-lists";

export const baseCategories = [
  "لابتوب",
  "جهاز مكتبي",
  "شاشة",
  "هاتف محمول",
  "تابلت",
  "شريحة اتصال",
  "طابعة",
  "ماسح ضوئي",
  "مركبة",
  "مفاتيح مكتب",
  "بطاقة دخول",
  "راوتر",
  "سماعة رأس",
  "بطارية متنقلة",
  "توكن USB",
  "مفتاح أمان",
  "معدات أخرى",
];

export const baseStatuses = [
  "متاحة",
  "مُسندة",
  "مُرجعة",
  "بانتظار الإرجاع",
  "مفقودة",
  "تالفة",
  "صيانة",
  "مستبعدة",
];

export const CATEGORY_KEY = "custody-categories";
export const STATUS_KEY = "custody-statuses";

export type OptionsApi = OptionListApi;

export const useCategories = () => useOptionList(CATEGORY_KEY, baseCategories);
export const useStatuses = () => useOptionList(STATUS_KEY, baseStatuses);
