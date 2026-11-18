"use client";

import { Download, LogOut, MoreHorizontal, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  SheetContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/overlay-menus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function OverlayDemos() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>
              Pops in from 96% scale, traps focus, closes on Escape, and pauses smooth scrolling while open.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Confirm</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Open sheet</Button>
        </DialogTrigger>
        <SheetContent side="right">
          <DialogHeader>
            <DialogTitle>Side sheet</DialogTitle>
            <DialogDescription>Used for filters and admin drawers. Slides from the edge.</DialogDescription>
          </DialogHeader>
        </SheetContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Bottom sheet</Button>
        </DialogTrigger>
        <SheetContent side="bottom">
          <DialogHeader>
            <DialogTitle>Bottom sheet</DialogTitle>
            <DialogDescription>Mobile-friendly confirmation surface.</DialogDescription>
          </DialogHeader>
        </SheetContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" aria-label="More actions">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <User /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download /> Certificates
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger">
            <LogOut /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">Hover for tooltip</Button>
        </TooltipTrigger>
        <TooltipContent>Tooltips use the forest-deep surface</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function ToastDemos() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" size="sm" onClick={() => toast.success("Lesson completed", { description: "Progress saved." })}>
        Success toast
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.error("Payment failed", { description: "Showcase example." })}>
        Error toast
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.info("New announcement")}>
        Info toast
      </Button>
    </div>
  );
}

export function TabsDemo() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-ink-soft">
        The active pill glides between tabs using a shared layout animation.
      </TabsContent>
      <TabsContent value="curriculum" className="text-ink-soft">
        Tab panels fade in and are fully keyboard navigable (arrow keys).
      </TabsContent>
      <TabsContent value="outcomes" className="text-ink-soft">
        Reduced-motion users get instant transitions.
      </TabsContent>
    </Tabs>
  );
}

export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible defaultValue="q1" className="border-t border-line">
      <AccordionItem value="q1">
        <AccordionTrigger>How does the accordion animate?</AccordionTrigger>
        <AccordionContent>
          Height animates using Radix&apos;s measured content height; the plus icon rotates into a close mark.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="q2">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes: proper button semantics, aria-expanded and keyboard support.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="q3">
        <AccordionTrigger>Where is it used?</AccordionTrigger>
        <AccordionContent>The FAQ section, course curriculum and the student course player.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
