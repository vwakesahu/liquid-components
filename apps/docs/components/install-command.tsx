"use client";

import { useState } from "react";

const managers = ["npm", "pnpm", "yarn", "bun"] as const;
type PackageManager = (typeof managers)[number];

export function InstallCommand({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const [manager, setManager] = useState<PackageManager>("npm");
  const address = `<owner>/<repo>/${name}`;
  const commands: Record<PackageManager, string> = {
    npm: `npx shadcn@latest add ${address}`,
    pnpm: `pnpm dlx shadcn@latest add ${address}`,
    yarn: `yarn dlx shadcn@latest add ${address}`,
    bun: `bunx --bun shadcn@latest add ${address}`,
  };
  const command = commands[manager];

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="install-command-wrap">
      <div className="install-command-tabs" role="tablist" aria-label="Package manager">
        {managers.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={manager === item}
            onClick={() => setManager(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="install-command">
        <code>{command}</code>
        <button type="button" onClick={copy} aria-label={`Copy ${manager} installation command`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
