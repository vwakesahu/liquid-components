# Publishing Liquid UI

Liquid UI ships as an open-code shadcn registry and a documentation site. It does not require an npm package: the shadcn CLI downloads each component's source from the hosted registry.

## Public identities

- GitHub repository: `https://github.com/vwakesahu/liquid-components`
- Documentation: `https://liquidcomponents.xyz`
- Registry catalog: `https://liquidcomponents.xyz/r/registry.json`
- Git commits remain authored by `Vivek Sahu`; Vercel is only the hosting provider.

The Vercel project is deployed from the local working tree with the CLI rather than connected to Git. This keeps Git authorship independent from the Vercel account and avoids Git-committer membership checks.

## Validate locally

```bash
bun run build
bun run registry:validate
bun run docs:build
```

`registry:build` writes the same generated items to `public/r` for local inspection and `apps/docs/public/r` for the deployed Next.js application.

Test one generated item before publishing:

```bash
bunx --bun shadcn@latest view ./apps/docs/public/r/liquid-switch.json
```

## Push the public source

Create the public repository without changing the local Git author:

```bash
gh repo create vwakesahu/liquid-components --public --source=. --remote=origin --push
```

## Deploy with the Vercel CLI

The Vercel project uses `apps/docs` as its Root Directory and keeps “Include source files outside of the Root Directory” enabled so Next.js can consume `packages/liquid-ui`. The app-local `apps/docs/vercel.json` identifies the Next.js framework; the root remains a package-manager workspace rather than pretending to be the deployed app.

```bash
vercel link --yes --scope anonymous-scope --project liquid-components
vercel deploy --prod --scope anonymous-scope
```

The `.vercel` directory contains only the local project link and stays ignored by Git.

## Connect the domain

```bash
vercel domains add liquidcomponents.xyz liquid-components --scope anonymous-scope
vercel domains add www.liquidcomponents.xyz liquid-components --scope anonymous-scope
vercel domains inspect liquidcomponents.xyz --scope anonymous-scope
```

Apply the DNS records printed by Vercel at the domain registrar. Keep `liquidcomponents.xyz` canonical and redirect `www` to it.

## Verify production

```bash
curl --fail https://liquidcomponents.xyz/r/registry.json
bunx --bun shadcn@latest view https://liquidcomponents.xyz/r/liquid-switch.json
```

Direct installation works with every package manager supported by shadcn:

```bash
bunx --bun shadcn@latest add https://liquidcomponents.xyz/r/liquid-switch.json
```

Users who want a short namespace can register the collection once:

```bash
bunx --bun shadcn@latest registry add '@liquid=https://liquidcomponents.xyz/r/{name}.json'
bunx --bun shadcn@latest add @liquid/liquid-switch
```
