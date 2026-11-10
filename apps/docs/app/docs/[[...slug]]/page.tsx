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
import { ComponentGallery, HomeHero, HomePlayground } from "../../../components/home";
import { DocsPager } from "../../../components/docs-pager";
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

  // The overview is a landing page: its hero replaces the title block.
  const landing = page.url === "/docs";

  return (
    <DocsPage
      toc={data.toc}
      full={data.full ?? landing}
      tableOfContent={{ enabled: !landing, style: "clerk" }}
      tableOfContentPopover={{ enabled: !landing }}
      breadcrumb={{ enabled: !landing }}
      footer={{ enabled: false }}
    >
      {!landing && <DocsTitle className="docs-title">{data.title}</DocsTitle>}
      {!landing && data.description && (
        <DocsDescription className="docs-description">{data.description}</DocsDescription>
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
            ComponentGallery,
            HomeHero,
            HomePlayground,
          }}
        />
      </DocsBody>
      {!landing && <DocsPager url={page.url} />}
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
    ? `${siteConfig.name}, Liquid Glass components for shadcn/ui`
    : `${page.data.title} | ${siteConfig.name}`;

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
          alt: "Liquid UI, Liquid Glass components for React and shadcn/ui",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      site: siteConfig.xHandle,
      creator: siteConfig.xHandle,
      images: [siteConfig.ogImage],
    },
  };
}
