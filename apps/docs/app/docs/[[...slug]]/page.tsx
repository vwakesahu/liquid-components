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

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: page.url,
    },
    twitter: {
      title: page.data.title,
      description: page.data.description,
    },
  };
}
