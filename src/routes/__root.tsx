import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { FilterProvider } from "../lib/filter-context";
import { BrandingProvider } from "../lib/branding-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LRMIS — Labour Room MIS | NHM Madhya Pradesh" },
      {
        name: "description",
        content:
          "Government-grade maternal health analytics dashboard for NHM Madhya Pradesh — 52 districts, 1,200+ facilities.",
      },
      { property: "og:title", content: "LRMIS — Labour Room MIS | NHM Madhya Pradesh" },
      { name: "twitter:title", content: "LRMIS — Labour Room MIS | NHM Madhya Pradesh" },
      {
        property: "og:description",
        content:
          "Government-grade maternal health analytics dashboard for NHM Madhya Pradesh — 52 districts, 1,200+ facilities.",
      },
      {
        name: "twitter:description",
        content:
          "Government-grade maternal health analytics dashboard for NHM Madhya Pradesh — 52 districts, 1,200+ facilities.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a5f75501-eddd-4e0b-956e-beed5047fdbd/id-preview-b0d00fef--ec1af955-dc18-43e7-bfe4-a95d7cc6d735.lovable.app-1780420164997.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a5f75501-eddd-4e0b-956e-beed5047fdbd/id-preview-b0d00fef--ec1af955-dc18-43e7-bfe4-a95d7cc6d735.lovable.app-1780420164997.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nunito+Sans:wght@400;500;600;700;800&family=Public+Sans:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingProvider>
          <FilterProvider>
            <Outlet />
          </FilterProvider>
        </BrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
