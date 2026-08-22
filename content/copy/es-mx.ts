import type { UserRole } from "@/lib/profile";

export type NavItem = {
  href: string;
  label: string;
};

export type StudentNavIcon =
  | "home"
  | "courses"
  | "live"
  | "tasks"
  | "achievements"
  | "profile"
  | "settings"
  | "students"
  | "course-admin"
  | "submissions"
  | "admins";

export type StudentNavItem = NavItem & {
  icon: StudentNavIcon;
  match?: "exact" | "startsWith";
};

export type StudentNavigationConfig = {
  primary: StudentNavItem[];
  administration: {
    title: string;
    items: StudentNavItem[];
  } | null;
  footer: StudentNavItem[];
};

export const publicNavigation: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/login", label: "Iniciar sesión" },
  { href: "/registro", label: "Crear mi cuenta" },
];

export function getStudentNavigation(role: UserRole): StudentNavigationConfig {
  const primary: StudentNavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: "home" },
    { href: "/mis-cursos", label: "Mis cursos", icon: "courses" },
    { href: "/mis-clases", label: "Clases en vivo", icon: "live" },
    { href: "/mis-tareas", label: "Mis tareas", icon: "tasks" },
    { href: "/logros", label: "Logros", icon: "achievements" },
    { href: "/perfil", label: "Mi perfil", icon: "profile" },
  ];

  const administrationItems: StudentNavItem[] = [];

  if (role === "admin" || role === "super_admin") {
    administrationItems.push(
      { href: "/admin/students", label: "Alumnas", icon: "students", match: "startsWith" },
      { href: "/admin/courses", label: "Cursos", icon: "course-admin", match: "startsWith" },
      { href: "/admin/submissions", label: "Entregas", icon: "submissions", match: "startsWith" },
    );
  }

  if (role === "super_admin") {
    administrationItems.push({ href: "/admin/admins", label: "Administradores", icon: "admins", match: "startsWith" });
  }

  return {
    primary,
    administration:
      administrationItems.length > 0
        ? {
            title: "Administración",
            items: administrationItems,
          }
        : null,
    footer: [{ href: "/configuracion", label: "Configuración", icon: "settings" }],
  };
}

export function getAdminNavigation(role: "admin" | "super_admin") {
  const items: NavItem[] = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/students", label: "Alumnas" },
    { href: "/admin/courses", label: "Cursos" },
    { href: "/admin/submissions", label: "Entregas" },
  ];

  if (role === "super_admin") {
    items.push({ href: "/admin/admins", label: "Admins" });
  }

  return items;
}
