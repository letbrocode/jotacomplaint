"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import type { Department } from "@prisma/client";
import { useDebouncedCallback } from "use-debounce";
import { Status, Priority, ComplaintCategory } from "@prisma/client";

interface ComplaintsFiltersProps {
  departments?: Department[];
  showDepartmentFilter?: boolean;
  showStatusFilter?: boolean;
  showPriorityFilter?: boolean;
  showCategoryFilter?: boolean;
  statusOptions?: string[];
}

export function ComplaintsFilters({
  departments = [],
  showDepartmentFilter = true,
  showStatusFilter = true,
  showPriorityFilter = true,
  showCategoryFilter = true,
  statusOptions = Object.values(Status),
}: ComplaintsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    if (name !== "page") {
      params.delete("page");
    }
    return params.toString();
  };

  const handleFilterChange = (name: string, value: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString(name, value)}`);
    });
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    handleFilterChange("search", term);
  }, 300);

  const resetFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const currentStatus = searchParams.get("status") ?? "all";
  const currentPriority = searchParams.get("priority") ?? "all";
  const currentCategory = searchParams.get("category") ?? "all";
  const currentDepartmentId = searchParams.get("departmentId") ?? "all";
  const currentSearch = searchParams.get("search") ?? "";

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentPriority !== "all" ||
    currentCategory !== "all" ||
    currentDepartmentId !== "all" ||
    currentSearch;

  return (
    <div className="space-y-4 rounded-lg border p-4 sm:p-6 bg-card shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="ml-auto"
          >
            Reset Filters
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search complaints..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {showStatusFilter && (
          <Select
            value={currentStatus}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showPriorityFilter && (
          <Select
            value={currentPriority}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.values(Priority).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showCategoryFilter && (
          <Select
            value={currentCategory}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(ComplaintCategory).map((c) => (
                <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showDepartmentFilter && departments.length > 0 && (
          <Select
            value={currentDepartmentId}
            onValueChange={(value) => handleFilterChange("departmentId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
