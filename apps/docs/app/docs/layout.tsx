import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { DocsSidebar } from "../../components/docs-sidebar";
import { source } from "../../lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsSidebar />
      <DocsLayout
        tree={source.getPageTree()}
        nav={{ enabled: false }}
        searchToggle={{ enabled: false }}
        themeSwitch={{ enabled: false }}
        sidebar={{ enabled: false }}
        containerProps={{
          className: "docs-layout",
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
