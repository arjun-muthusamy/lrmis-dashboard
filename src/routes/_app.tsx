import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { useState } from "react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Full-width TopBar */}
      <TopBar pathname={pathname} collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Sidebar + Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
