import { signOutAction } from "@/app/actions/session";

type SignOutFormProps = {
  label?: string;
};

export function SignOutForm({ label = "Cerrar sesión" }: SignOutFormProps) {
  return (
    <form action={signOutAction}>
      <button className="uc-button-secondary w-full justify-center" type="submit">
        {label}
      </button>
    </form>
  );
}
