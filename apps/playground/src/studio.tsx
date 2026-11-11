// Recording stage for the docs hero film. One scene per `?scene=`, 960x540, real
// components over real photos; a recorder drives the pointer. Photos come from the
// docs dev server so nothing is duplicated.
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChevronLeft, Copy, Crop, Disc3, Ellipsis, Heart, Images, Info, Pause, Search, Share, Shuffle, SkipBack, SkipForward, SlidersHorizontal, SquareStack, Trash2, Users, X } from "lucide-react";
import {
  LiquidContextMenu,
  LiquidContextMenuContent,
  LiquidContextMenuItem,
  LiquidContextMenuSeparator,
  LiquidContextMenuTrigger,
  LiquidDrawer,
  LiquidDrawerContent,
  LiquidDrawerDescription,
  LiquidDrawerTitle,
  LiquidGlass,
  LiquidIsland,
  LiquidPageControl,
  LiquidProgress,
  LiquidSlider,
  LiquidSwitch,
  LiquidTabBar,
  LiquidTabBarItem,
  LiquidTabs,
  LiquidTabsList,
  LiquidTabsTrigger,
  LiquidToolbar,
  LiquidToolbarButton,
  LiquidToolbarGroup,
  liquidSpring,
} from "@liquid-ui/core";
import "./styles.css";

const DOCS = "http://localhost:3001";
const wide = (id: string) => `${DOCS}/photos/wide/${id}.webp`;
const full = (id: string) => `${DOCS}/photos/full/${id}.webp`;
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


/* Context menu: hold a photo in the library; it lifts, the page blurs and the menu opens beside it. */
const LIBRARY = ["1015", "1069", "1022", "1036", "1043", "1018", "1050", "1053", "1060", "1067", "1047", "1080"];
function ContextMenuScene() {
  return (
    <div className="absolute inset-0 grid grid-cols-4 gap-[3px] bg-white">
      {LIBRARY.map((id, index) => {
        const tile = <img src={full(id)} alt="" draggable={false} className="block h-[178px] w-full object-cover" />;
        // The held photo sits in the top row, so the menu opens below it with room to spare.
        if (index !== 1) return <div key={id}>{tile}</div>;
        return (
          <LiquidContextMenu key={id}>
            <LiquidContextMenuTrigger data-studio="photo" className="block">
              {tile}
            </LiquidContextMenuTrigger>
            <LiquidContextMenuContent>
              <LiquidContextMenuItem><Copy aria-hidden="true" />Copy</LiquidContextMenuItem>
              <LiquidContextMenuItem><Share aria-hidden="true" />Share</LiquidContextMenuItem>
              <LiquidContextMenuItem><Heart aria-hidden="true" />Favourite</LiquidContextMenuItem>
              <LiquidContextMenuSeparator />
              <LiquidContextMenuItem destructive><Trash2 aria-hidden="true" />Delete</LiquidContextMenuItem>
            </LiquidContextMenuContent>
          </LiquidContextMenu>
        );
      })}
    </div>
  );
}

/* Toolbar: a photo's edit bar; the finger slides across the group and the droplet follows. */
function ToolbarScene() {
  return (
    <>
      <Photo id="49" />
      <div className="absolute inset-x-0 bottom-9 flex justify-center">
        <LiquidToolbar aria-label="Photo">
          <LiquidToolbarGroup>
            <LiquidToolbarButton aria-label="Back"><ChevronLeft /></LiquidToolbarButton>
          </LiquidToolbarGroup>
          <LiquidToolbarGroup data-studio="group">
            <LiquidToolbarButton aria-label="Favourite"><Heart /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Info"><Info /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Adjust"><SlidersHorizontal /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Crop"><Crop /></LiquidToolbarButton>
          </LiquidToolbarGroup>
          <LiquidToolbarGroup>
            <LiquidToolbarButton aria-label="Share"><Share /></LiquidToolbarButton>
          </LiquidToolbarGroup>
        </LiquidToolbar>
      </div>
    </>
  );
}

/* Page control: a carousel of photos; scrub across the dots and the pill stretches from dot to dot. */
const PAGES = ["1043", "1015", "49", "1036", "16"];
function PageControlScene() {
  const [page, setPage] = useState(0);
  return (
    <>
      <div className="absolute inset-0 flex" style={{ translate: `${-page * 960}px 0`, transition: "translate .7s var(--liquid-spring)" }}>
        {/* The spare photo after the last page catches the spring's overshoot. */}
        {[...PAGES, "1050"].map((id) => (
          <img key={id} src={wide(id)} alt="" draggable={false} className="h-[540px] w-[960px] shrink-0 object-cover" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <LiquidPageControl data-studio="pages" count={PAGES.length} value={page} onValueChange={setPage} aria-label="Photo" />
      </div>
    </>
  );
}

/* Theme: the same components in four accents; one variable changes all of them. */
const STUDIO_ACCENTS = ["#0a8ad0", "#c2560c", "#1f8a4c", "#c2255c"];
function ThemeScene() {
  const [turn, setTurn] = useState(0);
  const [brightness, setBrightness] = useState([64]);
  const [night, setNight] = useState(true);
  const accent = STUDIO_ACCENTS[turn % STUDIO_ACCENTS.length]!;
  const card = "grid content-start gap-5 rounded-[26px] bg-[#f4f4f6] p-6";
  return (
    <div className="absolute inset-0 grid place-items-center bg-white" style={{ "--liquid-accent": accent } as React.CSSProperties}>
      <div className="grid w-[880px] justify-items-center gap-6">
        <span
          className="flex items-center gap-2.5 rounded-full bg-[#f4f4f6] px-4 py-2 text-[16px] text-[#2a2a30]"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        >
          <i className="block size-3.5 rounded-full transition-colors duration-300" style={{ background: accent }} />
          --liquid-accent: {accent};
        </span>
        <div className="grid w-full grid-cols-[1fr_1fr_1.25fr] gap-4">
          <section className={card}>
            <strong className="text-[17px] font-semibold">Display</strong>
            <LiquidSlider value={brightness} onValueChange={setBrightness} aria-label="Brightness" className="w-full" />
            <span className="flex items-center justify-between text-[15px]">
              Night Shift
              <LiquidSwitch checked={night} onCheckedChange={setNight} tint="var(--liquid-accent)" aria-label="Night Shift" />
            </span>
          </section>
          <section className={card}>
            <strong className="text-[17px] font-semibold">Upload</strong>
            <LiquidTabs defaultValue="week" className="w-auto">
              <LiquidTabsList aria-label="Range" size="small" className="w-full min-w-0">
                <LiquidTabsTrigger value="day">Day</LiquidTabsTrigger>
                <LiquidTabsTrigger value="week">Week</LiquidTabsTrigger>
                <LiquidTabsTrigger value="month">Month</LiquidTabsTrigger>
              </LiquidTabsList>
            </LiquidTabs>
            <LiquidProgress value={62} aria-label="Upload" />
          </section>
          <section className="relative grid h-[218px] place-items-end justify-center overflow-hidden rounded-[26px] pb-4">
            <img src={wide("1043")} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
            <LiquidTabBar aria-label="Photos" defaultValue="library">
              <LiquidTabBarItem value="library" icon={<Images />}>Library</LiquidTabBarItem>
              <LiquidTabBarItem value="albums" icon={<SquareStack />}>Albums</LiquidTabBarItem>
              <LiquidTabBarItem value="shared" icon={<Users />} badge={2}>Shared</LiquidTabBarItem>
            </LiquidTabBar>
          </section>
        </div>
        <button
          type="button"
          data-studio="shuffle"
          onClick={() => setTurn((n) => n + 1)}
          className="flex items-center gap-2 rounded-full bg-[#111113] px-5 py-3 text-[15px] font-medium text-white"
        >
          <Shuffle className="size-4" />
          Shuffle
        </button>
      </div>
    </div>
  );
}

/* ---------- Phone scenes: one Photos-style app at iPhone size, 402x874 pt. ----------
   The film draws the status bar and home indicator on top, so each screen keeps 54 pt
   clear at the top and 34 pt at the bottom. */
const GRID = ["1015", "1069", "1022", "1036", "1043", "1018", "1050", "1053", "1060", "1067", "1047", "1080", "11", "13", "16", "29", "37", "43", "49", "57", "1084"];
const sized = (id: string, w: number, h: number) => `https://picsum.photos/id/${id}/${w}/${h}`;

function PhoneGrid({ order = GRID, onHold }: { order?: string[]; onHold?: number }) {
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {order.map((id, index) => {
        const tile = <img src={full(id)} alt="" draggable={false} className="block aspect-square w-full object-cover" />;
        if (index !== onHold) return <div key={id}>{tile}</div>;
        return (
          <LiquidContextMenu key={id}>
            <LiquidContextMenuTrigger data-studio="photo" className="block">
              {tile}
            </LiquidContextMenuTrigger>
            <LiquidContextMenuContent>
              <LiquidContextMenuItem><Copy aria-hidden="true" />Copy</LiquidContextMenuItem>
              <LiquidContextMenuItem><Share aria-hidden="true" />Share</LiquidContextMenuItem>
              <LiquidContextMenuItem><Heart aria-hidden="true" />Favourite</LiquidContextMenuItem>
              <LiquidContextMenuSeparator />
              <LiquidContextMenuItem destructive><Trash2 aria-hidden="true" />Delete</LiquidContextMenuItem>
            </LiquidContextMenuContent>
          </LiquidContextMenu>
        );
      })}
    </div>
  );
}

function PhoneTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-4 pb-3 pt-[60px]">
      <p className="text-[13px] font-semibold uppercase tracking-[0.02em] text-[#8e8e93]">{sub}</p>
      <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em]">{title}</h1>
    </div>
  );
}

const PHONE_TABS = [
  { value: "library", label: "Library", icon: Images, title: "Library", sub: "Nov 11, 2026", order: GRID },
  { value: "albums", label: "Albums", icon: SquareStack, title: "Albums", sub: "12 albums", order: [...GRID.slice(6), ...GRID.slice(0, 6)] },
  { value: "shared", label: "Shared", icon: Users, title: "Shared", sub: "With 3 people", order: [...GRID.slice(12), ...GRID.slice(0, 12)] },
];

/* Library with the tab bar: drag the droplet across the tabs. */
function PhoneTabBarScene() {
  const [tab, setTab] = useState("library");
  const current = PHONE_TABS.find((entry) => entry.value === tab)!;
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <div key={tab} className="animate-[phone-fade_.28s_ease-out]">
        <PhoneTitle title={current.title} sub={current.sub} />
        <PhoneGrid order={current.order} />
      </div>
      <div className="absolute inset-x-0 bottom-[30px] flex justify-center">
        <LiquidTabBar
          aria-label="Photos"
          value={tab}
          onValueChange={setTab}
          accessory={
            <LiquidGlass className="grid size-[62px] shrink-0 place-items-center rounded-full">
              <Search className="size-[22px]" />
            </LiquidGlass>
          }
        >
          {PHONE_TABS.map((entry) => (
            <LiquidTabBarItem key={entry.value} value={entry.value} icon={<entry.icon />} badge={entry.value === "shared" ? 2 : undefined}>
              {entry.label}
            </LiquidTabBarItem>
          ))}
        </LiquidTabBar>
      </div>
    </div>
  );
}

/* An album: the drawer grows out of its options button and morphs to the share view. */
function PhoneDrawerScene() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"album" | "share">("album");
  const row = "flex h-[52px] w-full items-center gap-3 rounded-[18px] bg-[rgba(118,118,128,.1)] px-4 text-left text-[16px] font-medium";
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <div className="relative h-[520px]">
        <img src={sized("1015", 804, 1040)} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute bottom-5 left-5 text-white">
          <p className="text-[30px] font-bold leading-tight tracking-[-0.02em]">Summer 2026</p>
          <p className="text-[15px] text-white/80">48 photos</p>
        </div>
      </div>
      <PhoneGrid order={GRID.slice(3)} />
      <LiquidGlass className="absolute left-4 top-[58px] size-11 rounded-full text-[#1c1c1e] [--liquid-glass-tint:rgba(255,255,255,.55)]">
        <span className="grid size-full place-items-center"><ChevronLeft className="size-5" /></span>
      </LiquidGlass>
      <LiquidGlass className="absolute right-4 top-[58px] size-11 rounded-full text-[#1c1c1e] [--liquid-glass-tint:rgba(255,255,255,.55)]">
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
                    <svg viewBox="0 0 60 60" className="size-[56px]" aria-hidden="true">
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
    </div>
  );
}

/* The library: hold a photo, it lifts and the menu opens under it. */
function PhoneContextMenuScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <PhoneTitle title="Library" sub="Nov 11, 2026" />
      <PhoneGrid onHold={4} />
    </div>
  );
}

/* The photo viewer: slide across the edit toolbar and the droplet follows. */
function PhoneToolbarScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <img src={sized("49", 804, 1748)} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-x-0 bottom-[34px] flex justify-center">
        <LiquidToolbar aria-label="Photo">
          <LiquidToolbarGroup>
            <LiquidToolbarButton aria-label="Share"><Share /></LiquidToolbarButton>
          </LiquidToolbarGroup>
          <LiquidToolbarGroup>
            <LiquidToolbarButton aria-label="Favourite"><Heart /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Info"><Info /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Adjust"><SlidersHorizontal /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Crop"><Crop /></LiquidToolbarButton>
          </LiquidToolbarGroup>
          <LiquidToolbarGroup>
            <LiquidToolbarButton aria-label="Delete"><Trash2 /></LiquidToolbarButton>
          </LiquidToolbarGroup>
        </LiquidToolbar>
      </div>
    </div>
  );
}

/* Memories: scrub the page control and the pill stretches from dot to dot. */
const MEMORIES = [
  { id: "1043", title: "Yosemite" },
  { id: "1015", title: "Fjords" },
  { id: "1036", title: "First snow" },
  { id: "16", title: "The coast" },
  { id: "1050", title: "Big Sur" },
];
function PhonePageControlScene() {
  const [page, setPage] = useState(0);
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0 flex" style={{ translate: `${-page * 402}px 0`, transition: "translate .7s var(--liquid-spring)" }}>
        {[...MEMORIES, { id: "1084", title: "" }].map((memory) => (
          <div key={memory.id} className="relative h-[874px] w-[402px] shrink-0">
            <img src={sized(memory.id, 804, 1748)} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-[120px] left-6 text-white">
              <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-white/75">Memories</p>
              <p className="text-[32px] font-bold tracking-[-0.02em]">{memory.title}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-[58px] flex justify-center">
        <LiquidPageControl data-studio="pages" count={MEMORIES.length} value={page} onValueChange={setPage} aria-label="Memory" />
      </div>
    </div>
  );
}

/* Display settings: tap an accent and every control on the screen follows it. */
const PHONE_ACCENTS = [
  { name: "Blue", value: "#0a8ad0" },
  { name: "Orange", value: "#c2560c" },
  { name: "Green", value: "#1f8a4c" },
  { name: "Pink", value: "#c2255c" },
];
function PhoneThemeScene() {
  const [accent, setAccent] = useState(PHONE_ACCENTS[0]!.value);
  const [brightness, setBrightness] = useState([62]);
  const [night, setNight] = useState(true);
  const group = "grid gap-4 rounded-[26px] bg-white p-4";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f2f2f7]" style={{ "--liquid-accent": accent } as React.CSSProperties}>
      <PhoneTitle title="Display" sub="Settings" />
      <div className="grid gap-4 px-4">
        <section className={group}>
          <span className="text-[17px]">Brightness</span>
          <LiquidSlider value={brightness} onValueChange={setBrightness} aria-label="Brightness" className="w-full" />
          <span className="flex items-center justify-between text-[17px]">
            Night Shift
            <LiquidSwitch checked={night} onCheckedChange={setNight} tint="var(--liquid-accent)" aria-label="Night Shift" />
          </span>
        </section>
        <section className={group}>
          <span className="text-[17px]">Range</span>
          <LiquidTabs defaultValue="week" className="w-auto">
            <LiquidTabsList aria-label="Range" className="w-full min-w-0">
              <LiquidTabsTrigger value="day">Day</LiquidTabsTrigger>
              <LiquidTabsTrigger value="week">Week</LiquidTabsTrigger>
              <LiquidTabsTrigger value="month">Month</LiquidTabsTrigger>
            </LiquidTabsList>
          </LiquidTabs>
          <span className="grid gap-2.5 text-[15px] text-[#8e8e93]">
            Backing up, 3.1 of 5 GB
            <LiquidProgress value={62} aria-label="Backup" />
          </span>
        </section>
        <section className={group}>
          <span className="text-[17px]">Accent</span>
          <span className="flex gap-4">
            {PHONE_ACCENTS.map((entry) => (
              <button
                key={entry.name}
                type="button"
                data-studio={`accent-${entry.name.toLowerCase()}`}
                aria-label={entry.name}
                onClick={() => setAccent(entry.value)}
                className="size-11 rounded-full transition-[box-shadow] duration-200"
                style={{ background: entry.value, boxShadow: accent === entry.value ? `0 0 0 3px #fff, 0 0 0 5.5px ${entry.value}` : "none" }}
              />
            ))}
          </span>
        </section>
      </div>
    </div>
  );
}

/* 404: a magnifying glass lens glides from digit to digit, looking for the page. One loop is 6 s,
   restarted by the recorder (window.studioStart) so the clip can be cut on a loop boundary. */
const LENS_STOPS = [-186, 0, 186];
function NotFoundScene({ dark = false }: { dark?: boolean }) {
  const lens = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = lens.current;
    if (!element) return;
    const [a, b, c] = LENS_STOPS.map((x) => `${x}px 0`);
    let animation: Animation | undefined;
    const start = () => {
      animation?.cancel();
      animation = element.animate(
        [
          { translate: a, offset: 0, easing: "linear" },
          { translate: a, offset: 0.15, easing: liquidSpring },
          { translate: b, offset: 0.27, easing: "linear" },
          { translate: b, offset: 0.43, easing: liquidSpring },
          { translate: c, offset: 0.55, easing: "linear" },
          { translate: c, offset: 0.72, easing: liquidSpring },
          { translate: a, offset: 0.88, easing: "linear" },
          { translate: a, offset: 1 },
        ],
        { duration: 6000, iterations: Infinity },
      );
    };
    start();
    (window as unknown as { studioStart: () => void }).studioStart = start;
    return () => animation?.cancel();
  }, []);
  return (
    <div className={`absolute inset-0 grid place-items-center ${dark ? "bg-black text-[#f4f4f6]" : "bg-white text-[#111113]"}`}>
      <span className="select-none text-[300px] font-semibold leading-none tracking-[-0.06em]">404</span>
      <LiquidGlass
        ref={lens}
        lens={{ refraction: -40, bezel: 64, frost: 0 }}
        className="absolute left-1/2 top-1/2 -ml-[120px] -mt-[78px] h-[156px] w-[240px] rounded-full"
        style={{ "--liquid-glass-tint": dark ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.1)" } as React.CSSProperties}
      />
    </div>
  );
}

/* Social card, 1200x630: the headline on real glass over the photo, with real controls beside it. */
function OgScene() {
  const [brightness, setBrightness] = useState([70]);
  const [night, setNight] = useState(true);
  return (
    <div
      className="relative h-[630px] w-[1200px] overflow-hidden text-[#111113]"
      style={{ "--liquid-spring": liquidSpring, "--liquid-accent": "#0a8ad0", fontFamily: "Geist, -apple-system, sans-serif" } as React.CSSProperties}
    >
      <img src="https://picsum.photos/id/1015/2400/1260" alt="" className="absolute inset-0 size-full object-cover" />
      <LiquidGlass
        className="absolute bottom-11 left-11 top-11 grid w-[560px] content-between rounded-[40px] px-11 py-10"
        // Set inline, so it wins over the default tint: enough white for the text, the photo still through.
        style={{ "--liquid-glass-tint": "rgba(255,255,255,.58)" } as React.CSSProperties}
      >
        <span className="flex items-center gap-3 text-[22px] font-semibold tracking-[-0.02em]">
          <img src={`${DOCS}/icon.svg`} alt="" className="size-9" />
          Liquid UI
        </span>
        <span className="grid gap-5">
          <strong className="text-[70px] font-semibold leading-[0.98] tracking-[-0.048em]">
            Liquid Glass
            <br />
            for the web
          </strong>
          <span className="text-[23px] leading-[1.35] tracking-[-0.01em] text-black/70">21 iOS 26 components for React, with real refraction and real springs.</span>
        </span>
        <span className="text-[21px] font-medium tracking-[-0.01em] text-[#0a6fa8]">liquidcomponents.xyz</span>
      </LiquidGlass>
      <LiquidGlass
        lens={{ frost: 7 }}
        className="absolute right-11 top-11 grid w-[330px] gap-4 rounded-[30px] px-6 pb-6 pt-5 text-white [--liquid-glass-edge:rgba(255,255,255,.16)] [--liquid-glass-tint:rgba(18,18,22,.28)]"
      >
        <span className="text-[16px] font-semibold">Display</span>
        <label className="grid gap-3 text-[15px] font-medium">
          <span>Brightness</span>
          <LiquidSlider value={brightness} onValueChange={setBrightness} tint="#fff" aria-label="Brightness" />
        </label>
        <label className="flex items-center justify-between text-[15px] font-medium">
          <span>Night Shift</span>
          <LiquidSwitch checked={night} onCheckedChange={setNight} tint="var(--liquid-accent)" aria-label="Night Shift" />
        </label>
      </LiquidGlass>
      <div className="absolute bottom-11 right-11">
        <LiquidTabBar
          aria-label="Photos"
          defaultValue="library"
          accessory={
            <LiquidGlass className="grid size-[62px] shrink-0 place-items-center rounded-full">
              <Search className="size-[22px]" />
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
    </div>
  );
}

const SCENES: Record<string, () => React.ReactNode> = {
  tabbar: TabBarScene,
  controls: ControlsScene,
  drawer: DrawerScene,
  island: IslandScene,
  contextmenu: ContextMenuScene,
  toolbar: ToolbarScene,
  pagecontrol: PageControlScene,
  theme: ThemeScene,
  "phone-tabbar": PhoneTabBarScene,
  "phone-drawer": PhoneDrawerScene,
  "phone-contextmenu": PhoneContextMenuScene,
  "phone-toolbar": PhoneToolbarScene,
  "phone-pagecontrol": PhonePageControlScene,
  "phone-theme": PhoneThemeScene,
  notfound: () => <NotFoundScene />,
  "notfound-dark": () => <NotFoundScene dark />,
};

function Stage() {
  if (scene === "og") return <OgScene />;
  const Scene = SCENES[scene] ?? TabBarScene;
  // Phone scenes are an iPhone screen, 402x874 pt, in the system font like the real thing.
  const phone = scene.startsWith("phone-");
  return (
    <div
      className={`relative overflow-hidden bg-black text-[#1c1c1e] ${phone ? "h-[874px] w-[402px]" : "h-[540px] w-[960px]"}`}
      // The docs' accent, so the film carries the same blue as the site.
      style={{ "--liquid-spring": liquidSpring, "--liquid-accent": "#0a8ad0", fontFamily: phone ? "-apple-system, BlinkMacSystemFont, sans-serif" : "Geist, -apple-system, sans-serif" } as React.CSSProperties}
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
