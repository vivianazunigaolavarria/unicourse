"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FolderCog,
  GraduationCap,
  House,
  Layers3,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { signOutAction } from "@/app/actions/session";
import type { StudentNavIcon, StudentNavItem, StudentNavigationConfig } from "@/content/copy/es-mx";
import { cn } from "@/lib/cn";
import type { ViewerProfile } from "@/lib/profile";

type StudentNavigationProps = {
  navigation: StudentNavigationConfig;
  viewer: Pick<ViewerProfile, "first_name" | "last_name" | "email" | "role">;
};

type IconProps = {
  className?: string;
};

const iconMap: Record<StudentNavIcon, ComponentType<IconProps>> = {
  home: House,
  courses: BookOpen,
  live: Video,
  tasks: Layers3,
  achievements: Sparkles,
  profile: UserRound,
  settings: FolderCog,
  students: GraduationCap,
  "course-admin": BookOpen,
  submissions: Layers3,
  admins: Shield,
};

function getInitial(viewer: Pick<ViewerProfile, "first_name" | "last_name" | "email">) {
  const source = `${viewer.first_name} ${viewer.last_name}`.trim() || viewer.email;
  return source.charAt(0).toUpperCase() || "U";
}

function matchesPath(pathname: string, item: StudentNavItem) {
  if (item.match === "startsWith") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
}

function StudentNavSection({
  items,
  pathname,
  onNavigate,
}: {
  items: StudentNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="grid gap-1.5">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = matchesPath(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-[var(--uc-ink)] transition hover:bg-[rgba(107,92,224,0.08)] hover:text-[var(--uc-violet)]",
              isActive && "bg-[rgba(107,92,224,0.12)] text-[var(--uc-violet)] shadow-[inset_0_0_0_1px_rgba(107,92,224,0.08)]",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function StudentSidebarContent({
  navigation,
  pathname,
  viewer,
  onNavigate,
}: {
  navigation: StudentNavigationConfig;
  pathname: string;
  viewer: Pick<ViewerProfile, "first_name" | "last_name" | "email" | "role">;
  onNavigate?: () => void;
}) {
  const initial = getInitial(viewer);

  return (
    <div className="flex h-full flex-col gap-6">
      <Link href="/dashboard" onClick={onNavigate} className="rounded-[24px] border border-[var(--uc-border)] bg-white/72 p-4 no-underline">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,var(--uc-violet),rgba(127,223,201,0.95))] font-heading text-xl text-white shadow-[0_18px_32px_rgba(107,92,224,0.18)]">
            U
          </span>
          <span className="flex flex-col">
            <span className="font-heading text-[1.15rem] leading-none text-[var(--uc-ink)]">UniCourse</span>
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--uc-muted)]">Espacio de alumna</span>
          </span>
        </div>
      </Link>

      <div className="rounded-[24px] border border-[var(--uc-border)] bg-[linear-gradient(180deg,rgba(246,239,252,0.96),rgba(255,255,255,0.86))] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(107,92,224,0.92),rgba(127,223,201,0.8))] text-sm font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--uc-ink)]">{viewer.first_name || "UniCourse"}</p>
            <p className="truncate text-xs text-[var(--uc-muted)]">{viewer.email}</p>
          </div>
        </div>
      </div>

      <StudentNavSection items={navigation.primary} onNavigate={onNavigate} pathname={pathname} />

      {navigation.administration ? (
        <div className="grid gap-3 border-t border-[rgba(107,92,224,0.12)] pt-5">
          <p className="uc-kicker">{navigation.administration.title}</p>
          <StudentNavSection items={navigation.administration.items} onNavigate={onNavigate} pathname={pathname} />
        </div>
      ) : null}

      <div className="mt-auto grid gap-3 border-t border-[rgba(107,92,224,0.12)] pt-5">
        <StudentNavSection items={navigation.footer} onNavigate={onNavigate} pathname={pathname} />
        <form action={signOutAction}>
          <button
            className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-[var(--uc-ink)] transition hover:bg-[rgba(107,92,224,0.08)] hover:text-[var(--uc-violet)]"
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function StudentNavigation({ navigation, viewer }: StudentNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const initial = getInitial(viewer);

  return (
    <>
      <aside className="hidden w-[292px] shrink-0 lg:block">
        <div className="sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto rounded-[30px] border border-[var(--uc-border)] bg-[rgba(255,255,255,0.82)] p-4 shadow-[0_28px_64px_rgba(58,37,105,0.08)] backdrop-blur-xl">
          <StudentSidebarContent navigation={navigation} pathname={pathname} viewer={viewer} />
        </div>
      </aside>

      <div className="sticky top-0 z-40 mb-5 lg:hidden">
        <div className="flex items-center justify-between rounded-[24px] border border-[var(--uc-border)] bg-[rgba(255,255,255,0.88)] px-4 py-3 shadow-[0_20px_40px_rgba(58,37,105,0.08)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--uc-border)] text-[var(--uc-ink)]"
            aria-label="Abrir navegación"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="font-heading text-2xl leading-none text-[var(--uc-ink)] no-underline">
            UniCourse
          </Link>

          <Link
            href="/perfil"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(107,92,224,0.92),rgba(127,223,201,0.8))] text-sm font-semibold text-white no-underline"
            aria-label="Ir a mi perfil"
          >
            {initial}
          </Link>
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[rgba(43,33,64,0.38)] backdrop-blur-[2px]"
          />
          <div className="relative h-full max-w-[86vw] rounded-r-[30px] border-r border-[var(--uc-border)] bg-[var(--uc-cream)] p-4 shadow-[0_24px_72px_rgba(43,33,64,0.16)]">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--uc-border)] text-[var(--uc-ink)]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <StudentSidebarContent navigation={navigation} onNavigate={() => setIsOpen(false)} pathname={pathname} viewer={viewer} />
          </div>
        </div>
      ) : null}
    </>
  );
}
