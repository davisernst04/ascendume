"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Shield, UserRound } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountMenuProps {
  name: string;
  email: string;
}

export function AccountMenu({ name, email }: AccountMenuProps) {
  const router = useRouter();
  const initial =(name || email).trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm font-semibold text-ink hover:bg-mist/70 aria-expanded:bg-mist/70"
        aria-label="Account menu"
      >
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-full bg-ink text-[0.8125rem] font-bold text-surface"
        >
          {initial}
        </span>
        <span className="hidden max-w-36 truncate sm:inline">{name || email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-ink-soft">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound /> Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/privacy">
            <Shield /> Privacy
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                  router.refresh();
                },
              },
            })
          }
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
