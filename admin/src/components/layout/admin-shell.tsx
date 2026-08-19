"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Sidebar />

      <div className="min-h-screen pl-[238px]">
        <Header />

        <main className="min-h-[calc(100vh-72px)] px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}