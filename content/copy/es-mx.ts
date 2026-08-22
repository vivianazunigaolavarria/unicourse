export type NavItem = {
  href: string;
  label: string;
};

export const publicNavigation: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/iniciar-sesion", label: "Iniciar sesión" },
  { href: "/mis-cursos", label: "Portal de alumnas" },
  { href: "/admin", label: "Administración" },
];

export const studentNavigation: NavItem[] = [
  { href: "/mis-cursos", label: "Mis cursos" },
  { href: "/mis-tareas", label: "Mis tareas" },
  { href: "/mis-clases", label: "Mis clases" },
  { href: "/perfil", label: "Mi perfil" },
];

export const adminNavigation: NavItem[] = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/alumnas", label: "Alumnas" },
];

export const studentCourses = [
  {
    title: "IA desde cero",
    cohort: "Agosto 2026",
    progress: 62,
    nextStep: "Lección 5 · Prompts para atención al cliente",
    status: "En progreso",
  },
  {
    title: "Automatización simple",
    cohort: "Octubre 2026",
    progress: 0,
    nextStep: "Disponible al abrir inscripciones",
    status: "Próximamente",
  },
];

export const studentTasks = [
  {
    title: "Proyecto del módulo 3",
    dueDate: "27 de agosto de 2026",
    status: "Pendiente",
    summary: "Sube un archivo con tres prompts aplicados a tu negocio.",
  },
  {
    title: "Ejercicio del módulo 2",
    dueDate: "18 de agosto de 2026",
    status: "Aprobada",
    summary: "Ejercicio inicial aprobado por tu profesora.",
  },
];

export const liveClasses = [
  {
    title: "Cómo usar IA para ahorrar tiempo",
    date: "Martes, 25 de agosto · 7:00 p. m.",
    teacher: "Laura Hernández",
    action: "Entrar a la clase",
  },
  {
    title: "Sesión de preguntas y práctica",
    date: "Jueves, 3 de septiembre · 7:00 p. m.",
    teacher: "Laura Hernández",
    action: "Agendar recordatorio",
  },
];

export const adminCourseOutline = [
  { title: "Módulo 1 · Bienvenida", status: "Publicado", detail: "2 lecciones · 1 recurso" },
  { title: "Módulo 2 · Conceptos básicos", status: "Publicado", detail: "4 lecciones · 1 tarea" },
  { title: "Módulo 3 · Prompts útiles", status: "Editando", detail: "Lección actual: atención al cliente" },
  { title: "Módulo 4 · Automatización simple", status: "Borrador", detail: "3 lecciones · 0 tareas" },
];

export const adminStudents = [
  {
    name: "Ana Pérez",
    progress: "62%",
    cohort: "Agosto 2026",
    status: "Seguimiento",
    note: "Necesita un ajuste en su segunda entrega para volver a subirla.",
  },
  {
    name: "Carmen Ruiz",
    progress: "84%",
    cohort: "Agosto 2026",
    status: "Muy bien",
    note: "Participa mucho en vivo y avanza sin fricción.",
  },
  {
    name: "María López",
    progress: "38%",
    cohort: "Octubre 2026",
    status: "Atención",
    note: "Conviene recordarle la próxima clase en vivo.",
  },
];

