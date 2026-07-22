import { createMDX } from "fumadocs-mdx/next";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  outputFileTracingRoot: repositoryRoot,
  transpilePackages: ["@liquid-ui/core"],
  turbopack: {
    root: repositoryRoot,
  },
};

export default createMDX()(config);
