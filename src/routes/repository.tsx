import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArchiveLayout } from "@/components/legal/ArchiveLayout";
import { type ArchiveNode } from "@/lib/legal-data";
import { CreateFolderModal, DocumentUploadModal, ArchiveSettingsModal } from "@/components/legal/ArchiveModals";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  FileText,
  ChevronLeft,
  MoreVertical,
  Search,
  Settings,
  Filter,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/repository")({
  head: () => ({
    meta: [
      { title: "مستودع المستندات — نظام INT القانوني" },
    ],
  }),
  component: RepositoryPage,
});

function RepositoryPage() {
  const { can, user } = useAuth();
  const canEdit = can("repository", "edit");
  const queryClient = useQueryClient();

  const { data: repositoryRows = [], isLoading } = useQuery({
    queryKey: ["repository"],
    queryFn: async () => {
      const { data, error } = await supabase.from("repository").select(`*, profiles(full_name)`).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const data = useMemo(() => {
    // Build tree from flat rows
    const map = new Map<string, any>();
    const roots: any[] = [];
    
    repositoryRows.forEach(row => {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        type: row.type,
        updatedAt: new Date(row.created_at).toISOString().split("T")[0],
        size: row.size,
        fileType: row.file_type,
        department: row.department,
        owner: row.profiles?.full_name,
        status: row.status,
        children: [],
        parent_id: row.parent_id
      });
    });

    repositoryRows.forEach(row => {
      if (row.parent_id && map.has(row.parent_id)) {
        map.get(row.parent_id).children.push(map.get(row.id));
      } else {
        roots.push(map.get(row.id));
      }
    });

    return roots;
  }, [repositoryRows]);
  const [activeView, setActiveView] = useState("departments");
  
  // Breadcrumbs state - array of folder IDs
  const [path, setPath] = useState<string[]>([]);

  // Modals state
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Filters state
  const [search, setSearch] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterFileType, setFilterFileType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Simple recursive search to find current folder
  const currentFolder = useMemo(() => {
    if (path.length === 0) return null;
    let current: ArchiveNode[] = data;
    let node: ArchiveNode | null = null;
    
    for (const id of path) {
      const found = current.find(n => n.id === id);
      if (found) {
        node = found;
        current = found.children || [];
      } else {
        break;
      }
    }
    return node;
  }, [path, data]);

  // Recursive helper to get all files for global views
  const getAllFiles = (nodes: ArchiveNode[]): ArchiveNode[] => {
    let files: ArchiveNode[] = [];
    nodes.forEach(node => {
      if (node.type === "file") files.push(node);
      if (node.children) files = [...files, ...getAllFiles(node.children)];
    });
    return files;
  };

  const rawItems = useMemo(() => {
    if (activeView === "departments") {
      return currentFolder ? (currentFolder.children || []) : data;
    }
    
    // For all other views, gather all files and filter based on view
    const allFiles = getAllFiles(data);
    switch (activeView) {
      case "my-documents":
        // Mock: show files owned by any employee (or you could filter by logged-in user)
        return allFiles.filter(f => f.owner);
      case "shared":
        // Mock: show files not owned by an employee
        return allFiles.filter(f => !f.owner);
      case "recent":
        // Mock: show recently updated
        return [...allFiles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
      case "expiring":
        // Mock: show all files for now, or files with 'Expiring' status
        return allFiles;
      case "favorites":
        // Mock: show a subset
        return allFiles.slice(0, 2);
      case "trash":
        // Mock: show archived/expired
        return allFiles.filter(f => f.status === "Archived");
      case "dashboard":
      default:
        // Dashboard shows everything (folders + files) at root or a flat list of files
        return allFiles;
    }
  }, [activeView, currentFolder, data]);
  
  const items = rawItems.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDepartment && item.department !== filterDepartment) return false;
    if (filterEmployee && item.owner !== filterEmployee) return false;
    if (filterFileType && item.fileType !== filterFileType && item.type !== "folder") return false;
    if (filterDate && item.updatedAt !== filterDate) return false;
    return true;
  });

  const navigateTo = (node: ArchiveNode) => {
    if (node.type === "folder") {
      setPath([...path, node.id]);
    } else {
      console.log("Preview file", node.name);
    }
  };

  const navigateUp = (index: number) => {
    setPath(path.slice(0, index + 1));
  };

  const navigateHome = () => {
    setPath([]);
  };

  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string; name: string }[] = [];
    let current = data;
    for (const id of path) {
      const found = current.find(n => n.id === id);
      if (found) {
        crumbs.push({ id: found.id, name: found.name });
        current = found.children || [];
      }
    }
    return crumbs;
  }, [path, data]);

  const createNode = useMutation({
    mutationFn: async (node: any) => {
      const { data, error } = await supabase.from("repository").insert(node).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repository"] }),
  });

  const deleteNode = useMutation({
    mutationFn: async (id: string) => {
      // Deleting a folder in a relational DB might need to cascade or we just delete by ID and assume cascading is on
      const { error } = await supabase.from("repository").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repository"] }),
  });

  // CRUD Operations
  const handleCreateFolder = async (name: string) => {
    const parent_id = path.length > 0 ? path[path.length - 1] : null;
    await createNode.mutateAsync({
      name,
      type: "folder",
      parent_id
    });
    setFolderModalOpen(false);
  };

  const handleUploadFiles = async (formData: any) => {
    const { files, department, category, fileType, employee, issueDate, expiryDate } = formData;
    const parent_id = path.length > 0 ? path[path.length - 1] : null;

    const inserts = files.map((f: File) => ({
       name: f.name,
       type: "file",
       size: (f.size / 1024 / 1024).toFixed(2) + " MB",
       department,
       category,
       file_type: fileType || "مستند",
       owner_id: employee || null, // Assuming employee comes back as an ID if they selected it, if not might fail constraint
       status: "Active",
       confidentiality: category === "سري للغاية" ? "Highly Confidential" : "Normal",
       parent_id
    }));

    for (const item of inserts) {
       await createNode.mutateAsync(item);
    }
    setUploadModalOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من الحذف؟ سيتم حذف جميع الملفات الداخلية أيضاً.")) return;
    await deleteNode.mutateAsync(id);
  };

  return (
    <ArchiveLayout 
      activeView={activeView} 
      onViewChange={setActiveView}
      onNewClick={(type) => {
        if (type === "folder") setFolderModalOpen(true);
        if (type === "file") setUploadModalOpen(true);
      }}
    >
      <div className="flex h-full flex-col">
        {/* Header / Breadcrumbs */}
        <header className="flex flex-col border-b border-border bg-card">
          <div className="flex shrink-0 items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              {activeView === "departments" ? (
                <>
                  <button
                    onClick={navigateHome}
                    className={`transition-colors hover:text-foreground ${path.length === 0 ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    الرئيسية
                  </button>
                  {breadcrumbs.map((crumb, idx) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                      <ChevronLeft className="size-4 text-muted-foreground" />
                      <button
                        onClick={() => navigateUp(idx)}
                        className={`transition-colors hover:text-foreground ${idx === breadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {crumb.name}
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-foreground">
                  {activeView === "dashboard" && "نظرة عامة"}
                  {activeView === "my-documents" && "مستنداتي"}
                  {activeView === "shared" && "مستندات مشتركة"}
                  {activeView === "recent" && "الأخيرة"}
                  {activeView === "expiring" && "مستندات تنتهي قريباً"}
                  {activeView === "favorites" && "المفضلة"}
                  {activeView === "trash" && "سلة المهملات"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <select value={filterFileType} onChange={e => setFilterFileType(e.target.value)} className="h-9 rounded border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">كل الأنواع</option>
                <option value="PDF">PDF</option>
                <option value="Image">صورة</option>
                <option value="عقد">عقد</option>
              </select>
              <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className="h-9 rounded border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">كل الأقسام</option>
                <option value="الموارد البشرية">الموارد البشرية</option>
                <option value="المالية">المالية</option>
                <option value="الشؤون القانونية">الشؤون القانونية</option>
              </select>

              <div className="relative">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="البحث في المستندات..."
                  className="h-9 w-56 rounded-full border border-border bg-background pr-9 pl-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              
              {user?.role !== "employee" && (
                <>
                  <button onClick={() => setShowFilters(!showFilters)} className={`rounded-full p-2 hover:bg-secondary ${showFilters ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
                    <Filter className="size-4" />
                  </button>
                  <button onClick={() => setSettingsModalOpen(true)} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
                    <Settings className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          {(showFilters && user?.role !== "employee") && (
            <div className="flex items-center gap-4 bg-secondary/30 px-6 py-3 border-t border-border/50">
              <input type="text" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} placeholder="اسم الموظف..." className="h-8 w-40 rounded border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-8 w-40 rounded border border-border bg-background px-3 text-xs text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          )}
        </header>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <p>جاري تحميل المستودع...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              {activeView === "trash" ? (
                <Trash2 className="mb-4 size-12 opacity-20" />
              ) : (
                <Folder className="mb-4 size-12 opacity-20" />
              )}
              <p>لا توجد مستندات هنا أو لا توجد نتائج مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((node) => (
                <button
                  key={node.id}
                  onClick={() => navigateTo(node)}
                  className="group relative flex flex-col rounded-xl border border-border bg-card p-4 text-right transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${node.type === "folder" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-500"}`}>
                      {node.type === "folder" ? (
                        <Folder className="size-5 fill-current opacity-80" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </div>
                    
                    {canEdit && (
                      <button
                        onClick={(e) => handleDelete(e, node.id)}
                        className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title="حذف"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="mb-1 truncate text-sm font-semibold text-card-foreground" title={node.name}>
                    {node.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {node.type === "folder" ? `${node.children?.length || 0} عناصر` : node.size} • {node.updatedAt}
                  </p>
                  {node.owner && <p className="mt-1 text-[10px] text-muted-foreground">المالك: {node.owner}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateFolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />
      <DocumentUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleUploadFiles}
      />
      <ArchiveSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </ArchiveLayout>
  );
}
