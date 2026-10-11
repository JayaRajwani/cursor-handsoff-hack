"use client";

import { useState } from "react";
import { ListTree } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** On phones the course outline opens in a slide-out panel. */
export function MobileOutline({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <ListTree aria-hidden="true" />
          Lessons
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {/* Close the panel when a lesson link is clicked */}
        <div className="px-2 pb-6" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
