"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  LayoutList,
  LayoutGrid,
  Filter,
  Plus,
  Zap,
  Heart,
  MoreHorizontal,
  FileText,
  Calendar,
  XCircle,
  MessageSquare,
} from "lucide-react";

import type { JobApplication, ApplicationStats } from "@/types/jobs";
import { listApplications, getApplicationStats, updateApplicationStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
    case "reviewing":
      return "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-100";
    case "shortlisted":
    case "interviewing":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50";
    case "offered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50";
    case "rejected":
    case "withdrawn":
      return "bg-red-50 text-red-700 border-red-200 hover:bg-red-50";
    default:
      return "";
  }
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getLinkedinUrl(resumeData: Record<string, unknown>): string | null {
  const links = resumeData.links as Record<string, string> | undefined;
  if (links?.linkedin) return links.linkedin;
  const profiles = resumeData.profiles as Array<{ platform: string; url: string }> | undefined;
  return profiles?.find((p) => p.platform.toLowerCase().includes("linkedin"))?.url ?? null;
}

const COUNTRY_FLAGS: Record<string, string> = {
  usa: "\u{1F1FA}\u{1F1F8}",
  "united states": "\u{1F1FA}\u{1F1F8}",
  uk: "\u{1F1EC}\u{1F1E7}",
  "united kingdom": "\u{1F1EC}\u{1F1E7}",
  canada: "\u{1F1E8}\u{1F1E6}",
  australia: "\u{1F1E6}\u{1F1FA}",
  germany: "\u{1F1E9}\u{1F1EA}",
  france: "\u{1F1EB}\u{1F1F7}",
  spain: "\u{1F1EA}\u{1F1F8}",
  brazil: "\u{1F1E7}\u{1F1F7}",
  mexico: "\u{1F1F2}\u{1F1FD}",
  india: "\u{1F1EE}\u{1F1F3}",
  japan: "\u{1F1EF}\u{1F1F5}",
  china: "\u{1F1E8}\u{1F1F3}",
  argentina: "\u{1F1E6}\u{1F1F7}",
  colombia: "\u{1F1E8}\u{1F1F4}",
  netherlands: "\u{1F1F3}\u{1F1F1}",
  italy: "\u{1F1EE}\u{1F1F9}",
  portugal: "\u{1F1F5}\u{1F1F9}",
};


function MetricsCards({ stats }: { stats: ApplicationStats | null }) {
  if (!stats) return null;
  const cards = [
    { label: "Total Applications", value: stats.total, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
    { label: "Pending Review", value: stats.pending, iconBg: "bg-coral-100", iconColor: "text-coral-600" },
    { label: "Interviewing", value: stats.interviewing, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
    { label: "Offered", value: stats.offered, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
          <div className={`h-9 w-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
            <Zap className={`h-4 w-4 ${card.iconColor}`} />
          </div>
          <p className="text-3xl font-bold text-foreground">{card.value}</p>
          <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}


export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, statsData] = await Promise.all([
        listApplications({ status: statusFilter !== "all" ? statusFilter : undefined }),
        getApplicationStats(),
      ]);
      setApplications(apps);
      setStats(statsData);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!search) return applications;
    const q = search.toLowerCase();
    return applications.filter(
      (a) =>
        a.candidate_name.toLowerCase().includes(q) ||
        a.candidate_email.toLowerCase().includes(q) ||
        a.job_title.toLowerCase().includes(q)
    );
  }, [applications, search]);

  const handleStatusChange = useCallback((applicationId: string, newStatus: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus as JobApplication["status"] } : a))
    );
  }, []);

  const columns = useMemo<ColumnDef<JobApplication>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "id",
        header: "App ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.id.slice(0, 6)}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: "candidate_name",
        header: "Candidate",
        cell: ({ row }) => {
          const a = row.original;
          const linkedin = getLinkedinUrl(a.resume_data);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-medium text-white">
                  {getInitials(a.candidate_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm text-foreground truncate">{a.candidate_name}</span>
              {linkedin && (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-teal-600 transition-colors shrink-0"
                  title="LinkedIn"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "job_title",
        header: "Applied Role",
        cell: ({ row }) => <span className="text-sm text-foreground">{row.original.job_title}</span>,
      },
      {
        accessorKey: "job_location",
        header: "Location",
        cell: ({ row }) => {
          const loc = row.original.job_location;
          if (!loc) return <span className="text-muted-foreground text-sm">—</span>;
          const country = loc.split(",").pop()?.trim().toLowerCase() ?? "";
          const flag = COUNTRY_FLAGS[country] ?? "";
          return (
            <span className="text-sm text-muted-foreground">
              {flag} {loc}
            </span>
          );
        },
      },
      {
        accessorKey: "ai_score",
        header: "AI Match",
        cell: ({ row }) => {
          const score = row.original.ai_score;
          const pct = (score * 100).toFixed(0);
          let color = "text-muted-foreground";
          if (score >= 0.8) color = "text-emerald-600";
          else if (score < 0.5) color = "text-red-500";
          else if (score >= 0.5) color = "text-coral-600";
          return (
            <div className={cn("flex items-center gap-1.5 text-sm font-medium", color)}>
              <Zap className="h-3.5 w-3.5" />
              {pct}%
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-xs font-medium capitalize", statusBadgeClass(row.original.status))}
          >
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "applied_at",
        header: "Applied",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.applied_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-coral-500"
                title="Favorite"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => router.push(`/dashboard/applications/${a.id}`)}
                  >
                    <FileText className="h-4 w-4" />
                    View Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Calendar className="h-4 w-4" />
                    Schedule Interview
                  </DropdownMenuItem>
                  {a.status !== "shortlisted" && (
                    <DropdownMenuItem
                      className="gap-2 text-emerald-600 focus:text-emerald-600 cursor-pointer"
                      onClick={async () => {
                        await updateApplicationStatus(a.id, "shortlisted");
                        handleStatusChange(a.id, "shortlisted");
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Shortlist
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {a.status !== "rejected" && (
                    <DropdownMenuItem
                      className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                      onClick={async () => {
                        await updateApplicationStatus(a.id, "rejected");
                        handleStatusChange(a.id, "rejected");
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Candidate
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 80,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection, globalFilter: search },
    onGlobalFilterChange: setSearch,
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <MetricsCards stats={stats} />

        {}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
              <Input
                placeholder="Search candidates, roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 border-gray-200 focus:border-teal-300 focus:ring-teal-300/20"
              />
            </div>

            <div className="flex items-center border border-teal-200 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" ? "bg-teal-100 text-teal-700" : "text-muted-foreground hover:bg-teal-50"
                )}
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" ? "bg-teal-100 text-teal-700" : "text-muted-foreground hover:bg-teal-50"
                )}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    statusFilter === f.value
                      ? "bg-teal-600 text-white"
                      : "text-muted-foreground hover:bg-teal-50 hover:text-teal-700"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="gap-1.5 h-9 border-teal-200 text-teal-700 hover:bg-teal-50">
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
              <Button size="sm" className="gap-1.5 h-9 btn-primary">
                <Plus className="h-3.5 w-3.5" />
                Create Job
              </Button>
            </div>
          </div>
        </div>

        {}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-gray-50 hover:bg-gray-50">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex items-center justify-center gap-3 text-muted-foreground">
                      <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Loading applications...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-10 w-10 text-teal-200" />
                      <p>No applications found.</p>
                      <p className="text-xs text-muted-foreground/60">
                        Applications will appear here once candidates apply.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-gray-50/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {table.getRowModel().rows.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
              <p className="text-xs text-muted-foreground">
                {table.getFilteredRowModel().rows.length} application(s)
                {selectedCount > 0 && ` · ${selectedCount} selected`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {}
      <button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30 hover:from-teal-700 hover:to-teal-800 transition-all flex items-center justify-center z-50"
        title="AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}
