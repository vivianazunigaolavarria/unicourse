import { redirect } from "next/navigation";

import { readSearchParam } from "@/lib/search-params";
import { withQuery } from "@/lib/urls";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  redirect(
    withQuery("/login", {
      notice: readSearchParam(params.notice),
      next: readSearchParam(params.next),
    }),
  );
}
