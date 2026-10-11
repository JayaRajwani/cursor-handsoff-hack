"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { CourseSummary } from "@/lib/content/courses";
import { CourseCard } from "./course-card";

type Props = {
  courses: CourseSummary[];
  roles: Record<string, string>;
  levels: readonly string[];
};

/** Course list with search and filters (tool, level, healthcare role). Runs in the browser. */
export function CourseCatalog({ courses, roles, levels }: Props) {
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState("all");
  const [level, setLevel] = useState("all");
  const [role, setRole] = useState("all");

  const tools = useMemo(() => [...new Set(courses.map((c) => c.tool))].sort(), [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (tool !== "all" && course.tool !== tool) return false;
      if (level !== "all" && course.level !== level) return false;
      if (role !== "all" && !course.roles.includes(role as CourseSummary["roles"][number])) return false;
      if (q && !`${course.title} ${course.subtitle} ${course.tool}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [courses, query, tool, level, role]);

  const hasFilters = query || tool !== "all" || level !== "all" || role !== "all";

  function reset() {
    setQuery("");
    setTool("all");
    setLevel("all");
    setRole("all");
  }

  return (
    <div>
      <form role="search" aria-label="Search and filter courses" className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_1fr]" onSubmit={(e) => e.preventDefault()}>
        <div className="relative">
          <label htmlFor="course-search" className="sr-only">
            Search courses
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="course-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses…"
            className="pl-9"
          />
        </div>
        <div>
          <label htmlFor="filter-tool" className="sr-only">
            AI tool
          </label>
          <NativeSelect id="filter-tool" value={tool} onChange={(e) => setTool(e.target.value)}>
            <option value="all">All AI tools</option>
            {tools.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="filter-level" className="sr-only">
            Level
          </label>
          <NativeSelect id="filter-level" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">All levels</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="filter-role" className="sr-only">
            Healthcare role
          </label>
          <NativeSelect id="filter-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All roles</option>
            {Object.entries(roles).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {filtered.length} of {courses.length} courses
        </p>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course, i) => (
            <li key={course.slug}>
              <CourseCard course={course} priority={i < 3} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium text-primary">No courses match your filters.</p>
          <Button variant="link" onClick={reset}>
            Show all courses
          </Button>
        </div>
      )}
    </div>
  );
}
