import { AdminShell } from "@/components/layout/admin-shell";
import DashboardClient from "./dashboard-client";

export default function DashboardPage() {
  return (
    <AdminShell>
      <DashboardClient />
    </AdminShell>
  );
}