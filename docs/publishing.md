# Publishing Liquid UI

Liquid UI ships as an open-code shadcn registry and a separate documentation site. The registry does not need an npm package.

## Before the first release

Replace these placeholders after the public repository and docs domain are chosen:

- `registry.json` → `homepage`
- `apps/docs/components/install-command.tsx` → `<owner>/<repo>`
- `apps/docs/app/layout.tsx` → add the production `metadataBase`

## Validate locally

```bash
bun run build
bun run docs:build
bun run registry:validate
bun run registry:build
```

Test one generated item before publishing:

```bash
bunx --bun shadcn@latest add ./public/r/liquid-switch.json --dry-run -y
```

## Publish from GitHub

Current shadcn releases can install directly from a public GitHub source registry. Once this repository is public, users can run:

```bash
bunx --bun shadcn@latest add <owner>/<repo>/liquid-switch
bunx --bun shadcn@latest add <owner>/<repo>/liquid-slider
bunx --bun shadcn@latest add <owner>/<repo>/liquid-tabs
bunx --bun shadcn@latest add <owner>/<repo>/liquid-video-player
```

The root `registry.json` is the source of truth for this mode. GitHub registry installation does not require committing `public/r`, but the built JSON remains useful for a hosted namespace later.

## Deploy the docs

Deploy the repository to Vercel with `apps/docs` as the project root. Use Bun for dependency installation and `bun run build` as the build command.

After the domain is connected, update the docs metadata and registry homepage, then rebuild the registry artifacts.

## Add a namespace later

A stable namespace such as `@liquid` needs a hosted URL pattern like:

```text
https://liquid-ui.dev/r/{name}.json
```

Users can use the GitHub address immediately. Submit the namespace to shadcn's public registry directory only after the domain and item URLs are stable.
