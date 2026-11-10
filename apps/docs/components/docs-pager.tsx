import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { contents } from "./sidebar-content";

/** Previous and next page, in the sidebar's order and with the sidebar's names. */
export function DocsPager({ url }: { url: string }) {
  const pages = contents.flatMap((section) => section.list).filter((item) => item.href);
  const index = pages.findIndex((item) => item.href === url);
  if (index < 0) return null;
  const previous = pages[index - 1];
  const next = pages[index + 1];
  return (
    <nav aria-label="More pages" className="docs-pager">
      {previous ? (
        <Link href={previous.href!} className="docs-pager__link" rel="prev">
          <span className="docs-pager__label">
            <ArrowLeft aria-hidden="true" />
            Previous
          </span>
          <span className="docs-pager__title">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href!} className="docs-pager__link docs-pager__link--next" rel="next">
          <span className="docs-pager__label">
            Next
            <ArrowRight aria-hidden="true" />
          </span>
          <span className="docs-pager__title">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
