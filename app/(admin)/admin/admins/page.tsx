import { changeUserRoleAction } from "@/app/(admin)/admin/actions";
import { requireSuperAdminViewer } from "@/lib/auth";
import { listAdmins, listStudentsForRoleManagement } from "@/lib/data/admin";
import { formatDate, formatRoleLabel } from "@/lib/labels";
import { readSearchParam } from "@/lib/search-params";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";

type AdminsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const adminNoticeMessages: Record<string, { title: string; description: string; tone: "info" | "success" | "error" }> = {
  "role-updated": {
    title: "Rol actualizado",
    description: "El cambio quedó autorizado desde el servidor y registrado en auditoría.",
    tone: "success",
  },
  "role-update-failed": {
    title: "No pudimos actualizar el rol",
    description: "Solo el super admin puede hacer este cambio, y la cuenta objetivo debe existir.",
    tone: "error",
  },
};

export default async function AdminsPage({ searchParams }: AdminsPageProps) {
  const viewer = await requireSuperAdminViewer("/admin/admins");
  const params = (await searchParams) ?? {};
  const q = readSearchParam(params.q) ?? "";
  const noticeCode = readSearchParam(params.notice);
  const pageNotice = noticeCode ? adminNoticeMessages[noticeCode] ?? null : null;

  const [admins, students] = await Promise.all([listAdmins(q || undefined), listStudentsForRoleManagement(q || undefined)]);

  return (
    <>
      <SectionCard className="grid gap-5 rounded-[34px] p-8">
        <StatusChip tone="violet">Gestión de admins</StatusChip>
        <h1 className="font-heading text-5xl leading-tight">Solo el super admin puede promover o quitar acceso administrativo.</h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--uc-muted)]">
          Los cambios aquí llaman una función protegida en Supabase, no dependen del cliente y quedan registrados en `admin_audit_logs`.
        </p>
        {pageNotice ? <NoticeBanner {...pageNotice} /> : null}
      </SectionCard>

      <SectionCard className="grid gap-4">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="grid gap-2 text-sm font-medium text-[var(--uc-ink)]">
            Buscar cuentas
            <input className="uc-input" defaultValue={q} name="q" placeholder="Nombre o correo" type="search" />
          </label>
          <div className="flex items-end">
            <button className="uc-button-secondary w-full justify-center" type="submit">
              Filtrar
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard className="grid gap-4">
          <div>
            <p className="uc-kicker">Admins actuales</p>
            <h2 className="mt-2 font-heading text-3xl">Equipo con acceso administrativo</h2>
          </div>

          <div className="grid gap-3">
            {admins.map((admin) => (
              <div key={admin.id} className="grid gap-4 rounded-[22px] border border-[var(--uc-border)] p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone={admin.role === "super_admin" ? "violet" : "teal"}>
                      {formatRoleLabel(admin.role)}
                    </StatusChip>
                    <span className="text-sm text-[var(--uc-muted)]">Desde {formatDate(admin.created_at)}</span>
                  </div>
                  <h3 className="font-heading text-2xl">
                    {admin.display_name?.trim() || `${admin.first_name} ${admin.last_name}`}
                  </h3>
                  <p className="text-sm text-[var(--uc-muted)]">{admin.email}</p>
                </div>
                <div className="flex items-center">
                  {admin.id === viewer.id || admin.role === "super_admin" ? (
                    <p className="text-sm text-[var(--uc-muted)]">Cuenta protegida</p>
                  ) : (
                    <form action={changeUserRoleAction} className="w-full">
                      <input name="return_to" type="hidden" value="/admin/admins" />
                      <input name="target_profile_id" type="hidden" value={admin.id} />
                      <input name="target_role" type="hidden" value="student" />
                      <input name="reason" type="hidden" value="Democión desde el panel de super admin." />
                      <button className="uc-button-secondary w-full justify-center" type="submit">
                        Quitar admin
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="grid gap-4">
          <div>
            <p className="uc-kicker">Promover cuentas</p>
            <h2 className="mt-2 font-heading text-3xl">Alumnas elegibles para admin</h2>
          </div>

          <div className="grid gap-3">
            {students.map((student) => (
              <div key={student.id} className="grid gap-4 rounded-[22px] border border-[var(--uc-border)] p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                  <StatusChip tone="amber">Alumna</StatusChip>
                  <h3 className="font-heading text-2xl">
                    {student.display_name?.trim() || `${student.first_name} ${student.last_name}`}
                  </h3>
                  <p className="text-sm text-[var(--uc-muted)]">{student.email}</p>
                </div>
                <form action={changeUserRoleAction} className="flex items-center">
                  <input name="return_to" type="hidden" value="/admin/admins" />
                  <input name="target_profile_id" type="hidden" value={student.id} />
                  <input name="target_role" type="hidden" value="admin" />
                  <input name="reason" type="hidden" value="Promoción desde el panel de super admin." />
                  <button className="uc-button-primary w-full justify-center" type="submit">
                    Convertir en admin
                  </button>
                </form>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
