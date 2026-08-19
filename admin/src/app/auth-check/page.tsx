import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthCheckPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("worktrust_access_token")?.value;
  if (!token) redirect("/login?returnUrl=/auth-check");
  return <pre className="p-8 text-sm">Authenticated: yes</pre>;
}
