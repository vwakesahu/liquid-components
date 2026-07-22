"use client";

import { CheckIcon, ChevronDownIcon, CopyIcon, TerminalIcon } from "lucide-react";
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
      <div className="install-command-head">
        <span className="install-command-label">
          <TerminalIcon aria-hidden="true" />
          Install component
        </span>
        <label className="install-command-manager">
          <span className="sr-only">Package manager</span>
          <select
            value={manager}
            onChange={(event) => {
              setManager(event.target.value as PackageManager);
              setCopied(false);
            }}
          >
            {managers.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <ChevronDownIcon aria-hidden="true" />
        </label>
      </div>
      <div className="install-command">
        <span className="install-command-prompt" aria-hidden="true">$</span>
        <code>{command}</code>
        <button type="button" onClick={copy} aria-label={`Copy ${manager} installation command`} title={copied ? "Copied" : "Copy command"}>
          {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
        </button>
        <span className="sr-only" aria-live="polite">{copied ? "Command copied" : ""}</span>
      </div>
    </div>
  );
}
