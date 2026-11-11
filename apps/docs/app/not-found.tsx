import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { NotFoundFilm } from "../components/not-found-film";

export default function NotFound() {
  return (
    <main className="not-found">
      <NotFoundFilm />
      <h1 className="not-found__title">This page isn&apos;t here</h1>
      <p className="not-found__lead">The link might be old, or off by a letter. Everything else is right where you left it.</p>
      <div className="home-hero__actions">
        <Link href="/docs" className="home-pill home-pill--dark">
          Go to the docs
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/docs#components" className="home-pill">
          Browse components
        </Link>
      </div>
    </main>
  );
}
