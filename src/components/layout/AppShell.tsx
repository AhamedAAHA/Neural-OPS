"use client";

import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function AppShell({ title, subtitle, children, fullWidth }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav title={title} subtitle={subtitle} />
        <main className={fullWidth ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6"}>
          {children}
        </main>
      </div>
    </div>
  );
}
