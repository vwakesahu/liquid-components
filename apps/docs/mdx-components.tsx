import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { ComponentPreview } from "./components/component-preview";
import { InstallCommand } from "./components/install-command";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ComponentPreview,
    InstallCommand,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
