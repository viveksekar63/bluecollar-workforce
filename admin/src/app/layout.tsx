import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
export const metadata: Metadata = {
  title: "WorkTrust Admin",
  description: "Verified blue-collar workforce administration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
