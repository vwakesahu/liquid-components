import { createMDX } from "fumadocs-mdx/next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: repositoryRoot,
    resolveAlias: {
      "@": path.join(repositoryRoot, "src"),
    },
  },
  webpack(config) {
    config.resolve.alias["@"] = path.join(repositoryRoot, "src");
    return config;
  },
};

export default createMDX()(config);
