import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

/**
 * Server-side protection for every page rendered inside AdminShell.
 * This is intentionally in addition to middleware so a protected page
 * cannot render when the authentication cookie is missing.
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("worktrust_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--page)]">
      <Sidebar />
      <main className="ml-[238px] min-h-screen">
        <Header />
        <div className="p-7">{children}</div>
      </main>
    </div>
  );
}
