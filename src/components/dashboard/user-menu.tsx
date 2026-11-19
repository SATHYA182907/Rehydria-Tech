"use client";

import { ExternalLink, LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay-menus";
import { destroyServerSession } from "@/lib/auth/client-session";

export function UserMenu({ name, email, isAdmin }: { name: string; email: string | null; isAdmin: boolean }) {
  const router = useRouter();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "R";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-pill py-1 pr-1 pl-3 transition-colors hover:bg-canvas-2 focus-visible:outline-2 focus-visible:outline-moss">
        <span className="hidden text-right sm:flex sm:flex-col">
          <span className="text-sm font-medium leading-tight">{name}</span>
          {isAdmin && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-moss-text">Admin</span>}
        </span>
        <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-forest font-mono text-xs text-mint">
          {initials}
        </span>
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{email ?? name}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/courses">
            <LayoutDashboard /> My courses
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield /> Admin dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <UserRound /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">
            <ExternalLink /> Back to website
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          tone="danger"
          onSelect={async () => {
            await destroyServerSession();
            router.replace("/login");
            router.refresh();
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
