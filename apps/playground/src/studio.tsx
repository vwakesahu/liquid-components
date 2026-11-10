// Recording stage for the docs hero film. One scene per `?scene=`, 960x540, real
// components over real photos; a recorder drives the pointer. Photos come from the
// docs dev server so nothing is duplicated.
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Disc3, Ellipsis, Images, Pause, Search, SkipBack, SkipForward, SquareStack, Users, X } from "lucide-react";
import {
  LiquidDrawer,
  LiquidDrawerContent,
  LiquidDrawerDescription,
  LiquidDrawerTitle,
  LiquidGlass,
  LiquidIsland,
  LiquidSlider,
  LiquidSwitch,
  LiquidTabBar,
  LiquidTabBarItem,
  liquidSpring,
} from "@liquid-ui/core";
import "./styles.css";

const DOCS = "http://localhost:3001";
const wide = (id: string) => `${DOCS}/photos/wide/${id}.webp`;
const scene = new URLSearchParams(location.search).get("scene") ?? "tabbar";

function Photo({ id, shown = true, style }: { id: string; shown?: boolean; style?: React.CSSProperties }) {
  return (
    <img
      src={wide(id)}
      alt=""
      className="absolute inset-0 size-full object-cover transition-opacity duration-700"
      style={{ opacity: shown ? 1 : 0, ...style }}
    />
  );
}

/* Tab bar: slide across the tabs, then search grows out of the bar. */
const TABS = [
  { value: "library", label: "Library", icon: Images, photo: "1015" },
  { value: "albums", label: "Albums", icon: SquareStack, photo: "1043" },
  { value: "shared", label: "Shared", icon: Users, photo: "49" },
];

function TabBarScene() {
  const [tab, setTab] = useState("library");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searching) input.current?.focus({ preventScroll: true });
  }, [searching]);
  return (
    <>
      {TABS.map((entry) => (
        <Photo key={entry.value} id={entry.photo} shown={entry.value === tab} />
      ))}
      <div className="absolute inset-x-0 bottom-9 flex justify-center">
        <LiquidTabBar
          aria-label="Photos"
          value={tab}
          onValueChange={setTab}
          minimized={searching}
          accessory={
            <LiquidGlass
              className="flex shrink-0 items-center overflow-hidden rounded-full"
              style={{
                width: searching ? 300 : 62,
                height: searching ? 52 : 62,
                transition: "width .55s var(--liquid-spring), height .5s var(--liquid-spring)",
              }}
            >
              <button
                type="button"
                data-studio="search"
                aria-label="Search"
                className="grid h-full shrink-0 place-items-center"
                style={{ width: searching ? 44 : 62, transition: "width .4s var(--liquid-spring)" }}
                onClick={() => setSearching(true)}
              >
                <Search className="size-[22px]" style={{ opacity: searching ? 0.5 : 1 }} />
              </button>
              <input
                ref={input}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Coast, city, food…"
                className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-current placeholder:opacity-45"
                style={{ opacity: searching ? 1 : 0, transition: "opacity .2s .15s" }}
              />
              <span className="mr-3 grid size-7 shrink-0 place-items-center rounded-full bg-[rgba(118,118,128,.16)]" style={{ opacity: searching ? 1 : 0 }}>
                <X className="size-3.5" strokeWidth={2.6} />
              </span>
            </LiquidGlass>
          }
        >
          {TABS.map((entry) => (
            <LiquidTabBarItem key={entry.value} value={entry.value} icon={<entry.icon />} badge={entry.value === "shared" ? 2 : undefined}>
              {entry.label}
            </LiquidTabBarItem>
          ))}
        </LiquidTabBar>
      </div>
    </>
  );
}

/* Controls: the brightness and Night Shift really change the photo. */
function ControlsScene() {
  const [brightness, setBrightness] = useState([78]);
  const [warm, setWarm] = useState(false);
  const filter = `brightness(${0.4 + (brightness[0]! / 100) * 0.75}) ${warm ? "sepia(.32) saturate(1.2)" : ""}`;
  return (
    <>
      <Photo id="1043" style={{ filter, transition: "filter .25s ease" }} />
      <div className="absolute inset-0 grid place-items-center">
        <LiquidGlass
          lens={{ frost: 7 }}
          className="grid w-[340px] gap-5 rounded-[30px] px-6 pb-6 pt-5 text-white [--liquid-glass-edge:rgba(255,255,255,.16)] [--liquid-glass-tint:rgba(18,18,22,.3)]"
        >
          <p className="text-[15px] font-semibold">Display</p>
          <label className="grid gap-3 text-[15px] font-medium">
            <span>Brightness</span>
            <LiquidSlider data-studio="slider" value={brightness} onValueChange={setBrightness} tint="#fff" aria-label="Brightness" />
          </label>
          <label className="flex items-center justify-between text-[15px] font-medium">
            <span>Night Shift</span>
            <LiquidSwitch data-studio="switch" checked={warm} onCheckedChange={setWarm} tint="var(--liquid-accent)" aria-label="Night Shift" />
          </label>
        </LiquidGlass>
      </div>
    </>
  );
}

/* Drawer: rises, then morphs to the next view. */
const APPS = [
  { name: "Messages", fill: "#34c759", glyph: <path d="M30 15c-9.4 0-17 6.1-17 13.6 0 4.3 2.5 8.1 6.4 10.6-.4 2.2-1.6 4.4-3.4 5.8 3.4.2 6.6-1 8.9-2.9 1.6.4 3.3.6 5.1.6 9.4 0 17-6.1 17-13.6S39.4 15 30 15Z" fill="#fff" /> },
  { name: "Mail", fill: "#1a8cff", glyph: <><rect x="12" y="18" width="36" height="25" rx="4" fill="#fff" /><path d="m13.5 20.5 16.5 12 16.5-12" fill="none" stroke="#1a8cff" strokeWidth="2.4" /></> },
  { name: "Notes", fill: "#ffd60a", glyph: <path d="M12 29h36M12 37h36M12 45h22" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /> },
  { name: "Files", fill: "#0a84ff", glyph: <path d="M14 22a3 3 0 0 1 3-3h8l3 3h15a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3Z" fill="#fff" /> },
];

function DrawerScene() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"album" | "share">("album");
  useEffect(() => {
    (window as unknown as { studioOpen: () => void }).studioOpen = () => setOpen(true);
  }, []);
  const row = "flex h-[52px] w-full items-center gap-3 rounded-[18px] bg-[rgba(118,118,128,.1)] px-4 text-left text-[16px] font-medium";
  return (
    <>
      <Photo id="1015" />
      {/* The drawer grows out of this button and pours back into it. */}
      <LiquidGlass className="absolute right-6 top-6 size-12 rounded-full text-[#1c1c1e] [--liquid-glass-tint:rgba(255,255,255,.55)]">
        <button type="button" data-studio="more" aria-label="Album options" className="grid size-full place-items-center rounded-full" onClick={() => { setView("album"); setOpen(true); }}>
          <Ellipsis className="size-5" />
        </button>
      </LiquidGlass>
      <LiquidDrawer open={open} onOpenChange={setOpen}>
        <LiquidDrawerContent view={view} closeOnOutsideClick={false}>
          {view === "album" ? (
            <>
              <LiquidDrawerTitle>Summer 2026</LiquidDrawerTitle>
              <LiquidDrawerDescription>48 photos, shared with 3 people.</LiquidDrawerDescription>
              <div className="mt-6 grid gap-2">
                <button type="button" data-studio="share" className={row} onClick={() => setView("share")}>Share album</button>
                <button type="button" className={row}>People</button>
                <button type="button" className={`${row} text-[#e5484d]`}>Delete album</button>
              </div>
            </>
          ) : (
            <>
              <LiquidDrawerTitle>Share album</LiquidDrawerTitle>
              <LiquidDrawerDescription>Anyone with the link can view it.</LiquidDrawerDescription>
              <div className="mt-6 grid grid-cols-4 gap-2 text-center text-[12px]">
                {APPS.map((app) => (
                  <span key={app.name} className="grid justify-items-center gap-2">
                    <svg viewBox="0 0 60 60" className="size-[60px]" aria-hidden="true">
                      <rect width="60" height="60" rx="14" fill={app.fill} />
                      {app.glyph}
                    </svg>
                    {app.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </LiquidDrawerContent>
      </LiquidDrawer>
    </>
  );
}

/* Dynamic Island: a Live Activity that opens into the player. */
function IslandScene() {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <Photo id="1036" />
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <LiquidIsland
          data-studio="island"
          expanded={expanded}
          onExpandedChange={setExpanded}
          expandedSize={{ width: 380, height: 170 }}
          leading={<span className="grid size-[22px] place-items-center rounded-md bg-[#e5484d]"><Disc3 className="size-3.5" /></span>}
          trailing={<span className="flex h-3.5 items-center gap-0.5">{[0.5, 0.9, 0.6, 1].map((h, i) => <i key={i} className="block w-[3px] rounded bg-[#ff8a8f]" style={{ height: `${h * 100}%` }} />)}</span>}
        >
          <div className="grid w-full gap-3.5">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-[14px] bg-[#e5484d]"><Disc3 className="size-7" /></span>
              <span className="grid flex-1 leading-tight">
                <strong className="text-[15px] font-semibold">Slow Light</strong>
                <small className="text-[13px] text-white/55">Mira Vale</small>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] tabular-nums text-white/55">
              <span>0:48</span>
              <span className="h-1 flex-1 overflow-hidden rounded bg-white/20"><i className="block h-full w-[23%] rounded bg-white" /></span>
              <span>-2:46</span>
            </div>
            <div className="flex justify-center gap-8 [&_svg]:fill-current">
              <SkipBack className="size-[22px]" />
              <Pause className="size-7" />
              <SkipForward className="size-[22px]" />
            </div>
          </div>
        </LiquidIsland>
      </div>
    </>
  );
}

const SCENES: Record<string, () => React.ReactNode> = { tabbar: TabBarScene, controls: ControlsScene, drawer: DrawerScene, island: IslandScene };

function Stage() {
  const Scene = SCENES[scene] ?? TabBarScene;
  return (
    <div
      className="relative h-[540px] w-[960px] overflow-hidden bg-black text-[#1c1c1e]"
      // The docs' accent, so the film carries the same blue as the site.
      style={{ "--liquid-spring": liquidSpring, "--liquid-accent": "#0a8ad0", fontFamily: "Geist, -apple-system, sans-serif" } as React.CSSProperties}
    >
      <Scene />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Stage />
  </StrictMode>,
);
