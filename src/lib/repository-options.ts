import { useOptionList } from "@/lib/option-lists";

export const useRepositoryDepartments = () =>
  useOptionList("repository-departments", ["الموارد البشرية", "المالية", "الشؤون القانونية"]);

export const useRepositoryCategories = () =>
  useOptionList("repository-categories", ["عام", "سري", "سري للغاية"]);

export const useRepositoryFileTypes = () =>
  useOptionList("repository-file-types", ["عقد", "رخصة", "تقرير"]);
