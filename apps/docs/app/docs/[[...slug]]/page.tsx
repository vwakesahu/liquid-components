import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { TOCItemType } from "fumadocs-core/toc";
import type { MDXContent } from "mdx/types";
import { ComponentPreview } from "../../../components/component-preview";
import { siteConfig } from "../../../lib/site";
import { source } from "../../../lib/source";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const data = page.data as typeof page.data & {
    body: MDXContent;
    toc: TOCItemType[];
    full?: boolean;
  };
  const MDX = data.body;

  return (
    <DocsPage
      toc={data.toc}
      full={data.full}
      tableOfContent={{ style: "clerk" }}
    >
      <DocsTitle>{data.title}</DocsTitle>
      {data.description && (
        <DocsDescription>{data.description}</DocsDescription>
      )}
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            Accordion,
            Accordions,
            Step,
            Steps,
            Tab,
            Tabs,
            ComponentPreview,
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const description = page.data.description ?? siteConfig.description;
  const isOverview = page.url === "/docs";
  const socialTitle = isOverview
    ? `${siteConfig.name} — Liquid Glass components for shadcn/ui`
    : `${page.data.title} · ${siteConfig.name}`;

  return {
    title: isOverview ? { absolute: socialTitle } : page.data.title,
    description,
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      title: socialTitle,
      description,
      type: "website",
      locale: "en_US",
      url: page.url,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: "Liquid UI — Liquid Glass components for React and shadcn/ui",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [siteConfig.ogImage],
    },
  };
}
