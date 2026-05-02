"use client";

import { useSiteConfig } from "@/hooks/useSiteConfig";

export default function Footer() {
  const siteConfig = useSiteConfig();

  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
        <p>
          Powered by{" "}
          <span className="font-medium text-foreground">Go + Next.js</span>
        </p>
        <p className="mt-1">
          &copy; {new Date().getFullYear()} {siteConfig?.name || "Blog"}. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
}
