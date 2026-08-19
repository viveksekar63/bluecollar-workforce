import { AdminShell } from "@/components/layout/admin-shell";
import { WorkerProfileLive } from "@/components/workers/worker-profile-live";

export default async function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminShell><WorkerProfileLive id={id} /></AdminShell>;
}
