"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Bookmark,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  Heart,
  Images,
  Italic,
  Link,
  Pin,
  RotateCw,
  Search,
  SquareStack,
  Strikethrough,
  Trash2,
  Underline,
  Users,
  X,
} from "lucide-react";
import {
  LiquidButton,
  LiquidContextMenu,
  LiquidContextMenuContent,
  LiquidContextMenuItem,
  LiquidContextMenuSeparator,
  LiquidContextMenuTrigger,
  LiquidGlass,
  LiquidPageControl,
  LiquidProgress,
  LiquidProgressRing,
  LiquidSpinner,
  LiquidTabBar,
  LiquidTabBarItem,
  LiquidToaster,
  LiquidToolbar,
  LiquidToolbarButton,
  LiquidToolbarGroup,
  LiquidTooltip,
  LiquidTooltipContent,
  LiquidTooltipProvider,
  LiquidTooltipShortcut,
  LiquidTooltipTrigger,
  liquidSpring,
  toast,
} from "@liquid-ui/core";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Tab bar ----------------------------------------------------------------- */

// Photos from Unsplash via Lorem Picsum, saved locally; photographers are on the credits page.
type Tag = "Coast" | "Mountains" | "City" | "Food" | "Animals" | "Night";
const PHOTOS: Array<{ id: string; tag: Tag }> = [
  { id: "1015", tag: "Coast" }, { id: "1043", tag: "Mountains" }, { id: "57", tag: "City" },
  { id: "1080", tag: "Food" }, { id: "1050", tag: "Coast" }, { id: "1022", tag: "Night" },
  { id: "1018", tag: "Mountains" }, { id: "1047", tag: "City" }, { id: "1069", tag: "Animals" },
  { id: "13", tag: "Coast" }, { id: "29", tag: "Mountains" }, { id: "1067", tag: "City" },
  { id: "1060", tag: "Food" }, { id: "16", tag: "Coast" }, { id: "1036", tag: "Mountains" },
  { id: "43", tag: "Night" }, { id: "1084", tag: "Animals" }, { id: "37", tag: "Coast" },
  { id: "49", tag: "City" }, { id: "11", tag: "Mountains" }, { id: "1053", tag: "Coast" },
];
const BY: Record<string, [string, string]> = {
  "1015": ["Alexey Topolyanskiy", "-oWyJoSqBRM"], "1050": ["Joseph Barrientos", "xcC5ozHk_N8"], "1053": ["Anna Popović", "x7HJdJZqplo"],
  "13": ["Paul Jarvis", "3MtiSMdnoCo"], "16": ["Paul Jarvis", "gkT4FfgHO5o"], "37": ["Austin Neill", "erTjj730fMk"],
  "49": ["Margaret Barley", "Qo51KwK1dKg"], "1018": ["Andrew Ridley", "Kt5hRENuotI"], "1036": ["Wolfgang Lutz", "yOujaSETXlo"],
  "1043": ["Christian Joudrey", "mWRR1xj95hg"], "11": ["Paul Jarvis", "Cm7oKel-X2Q"], "29": ["Go Wild", "V0yAek6BgGk"],
  "1047": ["sergee bee", "bIQiMWxX_WU"], "1067": ["Kevin Young", "-icmOdYWXuQ"], "43": ["Oleg Chursin", "IoCWq07GaG4"],
  "57": ["Nicholas Swanson", "SyBYM8R6VU4"], "1080": ["veeterzy", "OJJIaFZOeX4"], "1060": ["Karl Fredrickson", "TYIzeCiZ_60"],
  "1069": ["Marat Gilyadzinov", "wpTWYBll4_w"], "1084": ["Jay Ruzesky", "h13Y8vyIXNU"], "1022": ["Vashishtha Jogi", "bClr95glx6k"],
};
const photo = (id: string) => `/photos/${id}.webp`;
const fullPhoto = (id: string) => `/photos/full/${id}.webp`;
const tagOf = (id: string) => PHOTOS.find((entry) => entry.id === id)?.tag ?? "Photo";
const TAGS = [...new Set(PHOTOS.map((entry) => entry.tag))];
const ACTIVITY = [
  { who: "Ana Ruiz", avatar: "/avatars/ana.svg", what: "added 3 photos to “City”", when: "2h", photos: ["57", "1047", "49"] },
  { who: "Leo Hart", avatar: "/avatars/leo.svg", what: "liked 3 photos in “Mountains”", when: "Yesterday", photos: ["1018", "11", "29"] },
  { who: "Maya Kapoor", avatar: "/avatars/maya.svg", what: "added 3 photos to “Coast”", when: "Mon", photos: ["13", "16", "37"] },
];

type Viewing = { ids: string[]; index: number };

function PhotoGrid({ ids, onOpen }: { ids: string[]; onOpen: (viewing: Viewing) => void }) {
  return (
    <div className="tabbar-demo__grid">
      {ids.map((id, index) => (
        <button key={id} type="button" aria-label={`Open ${tagOf(id).toLowerCase()} photo by ${BY[id]?.[0]}`} onClick={() => onOpen({ ids, index })}>
          <img src={photo(id)} alt="" width={200} height={200} loading="lazy" />
        </button>
      ))}
    </div>
  );
}

/** A photo opened from the grid: full size, with its photographer, and one step to either side. */
function PhotoViewer({ viewing, favourite, onFavourite, onMove, onClose }: {
  viewing: Viewing;
  favourite: boolean;
  onFavourite: () => void;
  onMove: (step: number) => void;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const id = viewing.ids[viewing.index]!;
  const [author, slug] = BY[id] ?? ["Unknown", ""];
  useEffect(() => root.current?.focus({ preventScroll: true }), []);
  return (
    <div
      ref={root}
      className="tabbar-demo__viewer"
      role="dialog"
      aria-label={`${tagOf(id)} photo by ${author}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
        else if (event.key === "ArrowRight") onMove(1);
        else if (event.key === "ArrowLeft") onMove(-1);
      }}
    >
      <img key={id} src={fullPhoto(id)} alt="" width={720} height={720} />
      <button type="button" className="tabbar-demo__step" data-side="left" aria-label="Previous photo" disabled={viewing.index === 0} onClick={() => onMove(-1)} />
      <button type="button" className="tabbar-demo__step" data-side="right" aria-label="Next photo" disabled={viewing.index === viewing.ids.length - 1} onClick={() => onMove(1)} />
      <div className="tabbar-demo__viewer-bar">
        <LiquidGlass className="tabbar-demo__round">
          <button type="button" aria-label="Back" onClick={onClose}>
            <ChevronLeft aria-hidden="true" />
          </button>
        </LiquidGlass>
        <span className="tabbar-demo__count">
          {viewing.index + 1} of {viewing.ids.length}
        </span>
        <LiquidGlass className="tabbar-demo__round">
          <button type="button" aria-label="Favourite" aria-pressed={favourite} data-on={favourite || undefined} onClick={onFavourite}>
            <Heart aria-hidden="true" />
          </button>
        </LiquidGlass>
      </div>
      <a className="tabbar-demo__credit" href={`https://unsplash.com/photos/${slug}`} target="_blank" rel="noreferrer">
        Photo by {author}
      </a>
    </div>
  );
}

/** The search tab: a glass circle that stretches into a field while the bar minimizes. */
function SearchAccessory({ active, query, onQuery, onOpen, onClose }: {
  active: boolean;
  query: string;
  onQuery: (query: string) => void;
  onOpen: () => void;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (active) input.current?.focus({ preventScroll: true });
  }, [active]);
  return (
    <LiquidGlass className="tabbar-demo__search" data-active={active || undefined}>
      <button type="button" className="tabbar-demo__search-icon" aria-label="Search" aria-expanded={active} onClick={active ? () => input.current?.focus() : onOpen}>
        <Search aria-hidden="true" />
      </button>
      <input
        ref={input}
        value={query}
        tabIndex={active ? 0 : -1}
        placeholder="Coast, city, food…"
        aria-label="Search photos"
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onClose()}
      />
      <button type="button" className="tabbar-demo__search-close" aria-label="Close search" tabIndex={active ? 0 : -1} onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </LiquidGlass>
  );
}

export function TabBarPreview() {
  const [tab, setTab] = useState("library");
  const [minimized, setMinimized] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [seenShared, setSeenShared] = useState(false);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [album, setAlbum] = useState<string | null>(null);
  const [favourites, setFavourites] = useState(["1022", "1069", "1015"]);
  const screen = useRef<HTMLDivElement>(null);
  const albums = [
    { title: "Favourites", ids: favourites },
    ...(["Coast", "Mountains", "City"] as const).map((tag) => ({ title: tag, ids: PHOTOS.filter((entry) => entry.tag === tag).map((entry) => entry.id) })),
  ];
  const openAlbum = albums.find((entry) => entry.title === album);
  const lastY = useRef(0);

  // Like iOS: scrolling down tucks the bar away, scrolling up brings it back.
  const onScroll = () => {
    const y = screen.current?.scrollTop ?? 0;
    const delta = y - lastY.current;
    lastY.current = y;
    if (searching) return;
    if (y < 24) setMinimized(false);
    else if (delta > 3) setMinimized(true);
    else if (delta < -3) setMinimized(false);
  };
  const closeSearch = () => {
    setSearching(false);
    setQuery("");
    setMinimized(false);
  };
  const matches = PHOTOS.filter((entry) => entry.tag.toLowerCase().startsWith(query.trim().toLowerCase()));

  return (
    <div className="tabbar-demo" style={{ "--liquid-spring": liquidSpring } as React.CSSProperties}>
      <div ref={screen} className="tabbar-demo__screen" onScroll={onScroll}>
        {searching ? (
          <>
            <header className="tabbar-demo__head">
              <h3>Search</h3>
              <p>{query ? `${matches.length} photos` : "Suggestions"}</p>
            </header>
            {query ? (
              matches.length ? (
                <PhotoGrid ids={matches.map((entry) => entry.id)} onOpen={setViewing} />
              ) : (
                <p className="tabbar-demo__empty">No photos match “{query}”</p>
              )
            ) : (
              <ul className="tabbar-demo__list">
                {TAGS.map((tag) => {
                  const tagged = PHOTOS.filter((entry) => entry.tag === tag);
                  return (
                    <li key={tag}>
                      <button type="button" onClick={() => setQuery(tag)}>
                        <img src={photo(tagged[0]!.id)} alt="" width={44} height={44} />
                        <span>
                          <strong>{tag}</strong>
                          <small>{tagged.length} photos</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : tab === "library" ? (
          <>
            <header className="tabbar-demo__head">
              <h3>Library</h3>
              <p>{PHOTOS.length} photos</p>
            </header>
            <PhotoGrid ids={PHOTOS.map((entry) => entry.id)} onOpen={setViewing} />
          </>
        ) : tab === "albums" && openAlbum ? (
          <>
            <header className="tabbar-demo__head">
              <button type="button" className="tabbar-demo__back" onClick={() => setAlbum(null)}>
                <ChevronLeft aria-hidden="true" />
                Albums
              </button>
              <h3>{openAlbum.title}</h3>
              <p>{openAlbum.ids.length} photos</p>
            </header>
            {openAlbum.ids.length ? (
              <PhotoGrid ids={openAlbum.ids} onOpen={setViewing} />
            ) : (
              <p className="tabbar-demo__empty">Tap the heart on a photo to add it here.</p>
            )}
          </>
        ) : tab === "albums" ? (
          <>
            <header className="tabbar-demo__head">
              <h3>Albums</h3>
              <p>{albums.length} albums</p>
            </header>
            <div className="tabbar-demo__albums">
              {albums.map((entry) => (
                <button key={entry.title} type="button" onClick={() => setAlbum(entry.title)}>
                  {entry.ids[0] ? (
                    <img src={photo(entry.ids[0])} alt="" width={240} height={240} />
                  ) : (
                    <span className="tabbar-demo__empty-cover" aria-hidden="true">
                      <Heart />
                    </span>
                  )}
                  <span>
                    <strong>{entry.title}</strong>
                    <small>{entry.ids.length}</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <header className="tabbar-demo__head">
              <h3>Shared</h3>
              <p>Activity</p>
            </header>
            <ul className="tabbar-demo__activity">
              {ACTIVITY.map((entry) => (
                <li key={entry.who}>
                  <img className="tabbar-demo__avatar" src={entry.avatar} alt="" width={36} height={36} />
                  <span>
                    <span className="tabbar-demo__line">
                      <strong>{entry.who}</strong> {entry.what}
                    </span>
                    <small>{entry.when}</small>
                    <span className="tabbar-demo__thumbs">
                      {entry.photos.map((id, index) => (
                        <button key={id} type="button" aria-label={`Open photo ${index + 1} from ${entry.who}`} onClick={() => setViewing({ ids: entry.photos, index })}>
                          <img src={photo(id)} alt="" width={72} height={72} />
                        </button>
                      ))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {viewing && (
        <PhotoViewer
          viewing={viewing}
          favourite={favourites.includes(viewing.ids[viewing.index]!)}
          onFavourite={() => {
            const id = viewing.ids[viewing.index]!;
            setFavourites((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [id, ...current]));
          }}
          onMove={(step) => setViewing((current) => current && { ...current, index: Math.min(current.ids.length - 1, Math.max(0, current.index + step)) })}
          onClose={() => setViewing(null)}
        />
      )}
      <div className="tabbar-demo__dock" data-hidden={viewing ? "" : undefined} onClickCapture={(event) => {
        // Tapping the minimized tab opens the bar again (and leaves search).
        if (!minimized || (event.target as Element).closest(".tabbar-demo__search")) return;
        if (searching) closeSearch();
        else setMinimized(false);
      }}>
        <LiquidTabBar
          aria-label="Photos"
          value={tab}
          minimized={minimized || searching}
          onValueChange={(value) => {
            setTab(value);
            setAlbum(null);
            if (value === "shared") setSeenShared(true);
            screen.current?.scrollTo({ top: 0 });
          }}
          accessory={
            <SearchAccessory
              active={searching}
              query={query}
              onQuery={setQuery}
              onOpen={() => {
                setSearching(true);
                screen.current?.scrollTo({ top: 0 });
              }}
              onClose={closeSearch}
            />
          }
        >
          <LiquidTabBarItem value="library" icon={<Images aria-hidden="true" />}>Library</LiquidTabBarItem>
          <LiquidTabBarItem value="albums" icon={<SquareStack aria-hidden="true" />}>Albums</LiquidTabBarItem>
          <LiquidTabBarItem value="shared" icon={<Users aria-hidden="true" />} badge={seenShared ? undefined : 2}>
            Shared
          </LiquidTabBarItem>
        </LiquidTabBar>
      </div>
    </div>
  );
}

export function TabBarBadgesPreview() {
  return (
    <div className="tabbar-photo">
      <img src="/photos/wide/1015.webp" alt="A fjord between steep cliffs" width={960} height={600} />
      <div className="tabbar-photo__dock">
        <LiquidTabBar aria-label="Photos" defaultValue="library">
          <LiquidTabBarItem value="library" icon={<Images aria-hidden="true" />}>Library</LiquidTabBarItem>
          <LiquidTabBarItem value="albums" icon={<SquareStack aria-hidden="true" />}>Albums</LiquidTabBarItem>
          <LiquidTabBarItem value="shared" icon={<Users aria-hidden="true" />} badge={2}>Shared</LiquidTabBarItem>
        </LiquidTabBar>
      </div>
    </div>
  );
}

/* Context menu ------------------------------------------------------------ */

type Message = { id: number; mine: boolean; text: string; liked?: boolean; pinned?: boolean };
const THREAD: Message[] = [
  { id: 1, mine: false, text: "Are we still on for Lisbon in May?" },
  { id: 2, mine: true, text: "Yes! Flights are booked." },
  { id: 3, mine: false, text: "Send me the apartment link when you have it" },
];

export function ContextMenuPreview() {
  const [messages, setMessages] = useState(THREAD);
  const update = (id: number, change: Partial<Message>) =>
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...change } : message)));
  return (
    <div className="chat-demo">
      <div className="chat-demo__head">
        <img src="/avatars/ana.svg" alt="" width={28} height={28} />
        <strong>Ana Ruiz</strong>
      </div>
      <ul className="chat-demo__thread" aria-label="Messages">
        {messages.map((message) => (
          <li key={message.id} data-mine={message.mine || undefined}>
            <LiquidContextMenu>
              <LiquidContextMenuTrigger className="chat-demo__wrap">
                <div className="chat-demo__bubble" data-mine={message.mine || undefined} tabIndex={0}>
                  {message.pinned && <Pin className="chat-demo__pin" aria-label="Pinned" />}
                  {message.text}
                  {message.liked && (
                    <span className="chat-demo__like" aria-label="Liked">
                      <Heart aria-hidden="true" />
                    </span>
                  )}
                </div>
              </LiquidContextMenuTrigger>
              <LiquidContextMenuContent align={message.mine ? "end" : "start"}>
                <LiquidContextMenuItem onSelect={() => update(message.id, { liked: !message.liked })}>
                  <Heart aria-hidden="true" />
                  {message.liked ? "Remove like" : "Like"}
                </LiquidContextMenuItem>
                <LiquidContextMenuItem
                  onSelect={() => {
                    navigator.clipboard?.writeText(message.text).catch(() => undefined);
                    toast.success("Copied");
                  }}
                >
                  <Copy aria-hidden="true" />
                  Copy
                </LiquidContextMenuItem>
                <LiquidContextMenuItem onSelect={() => update(message.id, { pinned: !message.pinned })}>
                  <Pin aria-hidden="true" />
                  {message.pinned ? "Unpin" : "Pin"}
                </LiquidContextMenuItem>
                <LiquidContextMenuSeparator />
                <LiquidContextMenuItem destructive onSelect={() => setMessages((current) => current.filter((entry) => entry.id !== message.id))}>
                  <Trash2 aria-hidden="true" />
                  Delete
                </LiquidContextMenuItem>
              </LiquidContextMenuContent>
            </LiquidContextMenu>
          </li>
        ))}
      </ul>
      {messages.length < THREAD.length && (
        <LiquidButton size="small" variant="link" onClick={() => setMessages(THREAD)}>
          Restore messages
        </LiquidButton>
      )}
      <LiquidToaster />
    </div>
  );
}

export function ContextMenuLinkPreview() {
  const [saved, setSaved] = useState(false);
  const href = "https://unsplash.com/photos/-oWyJoSqBRM";
  return (
    <div className="link-demo">
      <LiquidContextMenu>
        <LiquidContextMenuTrigger className="link-demo__wrap">
          <a className="link-demo__card" href={href} target="_blank" rel="noreferrer">
            <img src="/photos/wide/1015.webp" alt="" width={960} height={600} />
            <span>
              <strong>A fjord from the cliff edge</strong>
              <small>{saved ? "In your Reading List" : "unsplash.com, by Alexey Topolyanskiy"}</small>
            </span>
          </a>
        </LiquidContextMenuTrigger>
        <LiquidContextMenuContent>
          <LiquidContextMenuItem onSelect={() => window.open(href, "_blank", "noopener")}>
            <ExternalLink aria-hidden="true" />
            Open
          </LiquidContextMenuItem>
          <LiquidContextMenuItem
            onSelect={() => {
              navigator.clipboard?.writeText(href).catch(() => undefined);
              toast.success("Link copied");
            }}
          >
            <Link aria-hidden="true" />
            Copy Link
          </LiquidContextMenuItem>
          <LiquidContextMenuItem onSelect={() => setSaved((value) => !value)}>
            <Bookmark aria-hidden="true" />
            {saved ? "Remove from Reading List" : "Add to Reading List"}
          </LiquidContextMenuItem>
        </LiquidContextMenuContent>
      </LiquidContextMenu>
      <p className="link-demo__hint">A click opens the photo. Hold it, or right-click, for the menu.</p>
    </div>
  );
}

/* Tooltip ----------------------------------------------------------------- */

const FORMATS = [
  { key: "bold", label: "Bold", keys: "⌘B", icon: Bold },
  { key: "italic", label: "Italic", keys: "⌘I", icon: Italic },
  { key: "underline", label: "Underline", keys: "⌘U", icon: Underline },
  { key: "strike", label: "Strikethrough", keys: "⇧⌘X", icon: Strikethrough },
] as const;

export function TooltipPreview() {
  const [on, setOn] = useState<Record<string, boolean>>({ bold: true });
  const style: React.CSSProperties = {
    fontWeight: on.bold ? 650 : 400,
    fontStyle: on.italic ? "italic" : "normal",
    textDecorationLine: [on.underline && "underline", on.strike && "line-through"].filter(Boolean).join(" ") || "none",
  };
  return (
    <LiquidTooltipProvider>
      <div className="tooltip-demo">
        <LiquidToolbar aria-label="Formatting">
          <LiquidToolbarGroup>
            {FORMATS.map((format) => (
              <LiquidTooltip key={format.key}>
                <LiquidTooltipTrigger asChild>
                  <LiquidToolbarButton
                    aria-label={format.label}
                    aria-pressed={!!on[format.key]}
                    data-on={on[format.key] || undefined}
                    className="tooltip-demo__tool"
                    onClick={() => setOn((current) => ({ ...current, [format.key]: !current[format.key] }))}
                  >
                    <format.icon aria-hidden="true" />
                  </LiquidToolbarButton>
                </LiquidTooltipTrigger>
                <LiquidTooltipContent>
                  {format.label}
                  <LiquidTooltipShortcut>{format.keys}</LiquidTooltipShortcut>
                </LiquidTooltipContent>
              </LiquidTooltip>
            ))}
          </LiquidToolbarGroup>
        </LiquidToolbar>
        <p className="tooltip-demo__sample" style={style}>
          Hover a tool to see its name.
        </p>
      </div>
    </LiquidTooltipProvider>
  );
}

/* Progress ---------------------------------------------------------------- */

function useTicker(running: boolean, step: number, onTick: () => void) {
  const tick = useRef(onTick);
  tick.current = onTick;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick.current(), step);
    return () => window.clearInterval(id);
  }, [running, step]);
}

export function ProgressPreview() {
  const [value, setValue] = useState(18);
  useTicker(true, 900, () => setValue((current) => (current >= 100 ? 8 : Math.min(100, current + 14))));
  return (
    <div className="progress-demo">
      <LiquidProgress value={value} aria-label="Sample progress" />
      <div className="progress-demo__row">
        <LiquidProgressRing value={value} aria-label="Sample download" />
        <LiquidProgressRing value={null} aria-label="Waiting" />
        <LiquidSpinner />
        <LiquidSpinner size={28} />
      </div>
    </div>
  );
}

// Photos off the camera, sent one at a time like Photos does.
const SHOTS = [
  { name: "IMG_4821.HEIC", src: "/photos/1015.webp", size: 3.1 },
  { name: "IMG_4822.HEIC", src: "/photos/1043.webp", size: 2.6 },
  { name: "IMG_4830.HEIC", src: "/photos/57.webp", size: 3.8 },
];
const RATE = 0.9; // MB per second
const fresh = () => SHOTS.map(() => ({ sent: 0, cancelled: false }));

export function ProgressUploadPreview() {
  const [uploads, setUploads] = useState(fresh);
  const active = uploads.findIndex((upload, index) => !upload.cancelled && upload.sent < SHOTS[index]!.size);
  const done = uploads.filter((upload, index) => upload.sent >= SHOTS[index]!.size).length;
  useTicker(active >= 0, 100, () =>
    setUploads((current) =>
      current.map((upload, index) => (index === active ? { ...upload, sent: Math.min(SHOTS[index]!.size, upload.sent + RATE / 10) } : upload)),
    ),
  );
  // Once everything has gone, start over after a pause so the example keeps moving.
  useEffect(() => {
    if (active >= 0) return;
    const id = window.setTimeout(() => setUploads(fresh()), 3200);
    return () => window.clearTimeout(id);
  }, [active]);
  const set = (index: number, change: Partial<{ sent: number; cancelled: boolean }>) =>
    setUploads((current) => current.map((upload, at) => (at === index ? { ...upload, ...change } : upload)));

  return (
    <div className="upload-demo">
      <div className="upload-demo__head">
        <strong>Adding to “Trips”</strong>
        <small>
          {done} of {SHOTS.length}
        </small>
      </div>
      <ul className="upload-demo__list" aria-label="Uploads">
        {SHOTS.map((shot, index) => {
          const { sent, cancelled } = uploads[index]!;
          const state = cancelled ? "cancelled" : sent >= shot.size ? "done" : index === active ? "uploading" : "waiting";
          return (
            <li key={shot.name} data-state={state}>
              <img className="upload-demo__thumb" src={shot.src} alt="" width={44} height={44} />
              <span className="upload-demo__meta">
                <strong>{shot.name}</strong>
                {state === "uploading" && <LiquidProgress value={sent} max={shot.size} size="small" aria-label={`Uploading ${shot.name}`} />}
                <small>
                  {state === "uploading" && `${sent.toFixed(1)} of ${shot.size} MB, ${Math.ceil((shot.size - sent) / RATE)} s left`}
                  {state === "waiting" && "Waiting"}
                  {state === "done" && `${shot.size} MB`}
                  {state === "cancelled" && "Cancelled"}
                </small>
              </span>
              {state === "done" ? (
                <Check className="upload-demo__done" aria-label="Uploaded" />
              ) : state === "cancelled" ? (
                <button type="button" className="upload-demo__action" aria-label={`Retry ${shot.name}`} onClick={() => set(index, { sent: 0, cancelled: false })}>
                  <RotateCw aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="upload-demo__action" aria-label={`Cancel ${shot.name}`} onClick={() => set(index, { cancelled: true })}>
                  <X aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const APPS = [
  { name: "Lumen", kind: "Photo & Video", color: "#ff9f0a", glyph: <circle cx="15" cy="15" r="6" fill="none" stroke="#fff" strokeWidth="2.6" /> },
  { name: "Tide", kind: "Weather", color: "#0a84ff", glyph: <path d="M7 17c2.7-2.6 5.3-2.6 8 0s5.3 2.6 8 0M7 12c2.7-2.6 5.3-2.6 8 0s5.3 2.6 8 0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /> },
  { name: "Ledger", kind: "Finance", color: "#30a46c", glyph: <path d="M8 21V15m5 6V10m5 11v-8m5 8V8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /> },
];

type Download = "get" | "waiting" | "loading" | "open";

function AppRow({ app }: { app: (typeof APPS)[number] }) {
  const [stage, setStage] = useState<Download>("get");
  const [value, setValue] = useState(0);
  useTicker(stage === "loading", 110, () => setValue((current) => Math.min(100, current + 4)));
  useEffect(() => {
    if (stage === "loading" && value >= 100) setStage("open");
  }, [stage, value]);
  useEffect(() => {
    if (stage !== "waiting") return;
    const id = window.setTimeout(() => setStage("loading"), 900);
    return () => window.clearTimeout(id);
  }, [stage]);
  return (
    <li>
      <svg viewBox="0 0 30 30" className="store-demo__icon" aria-hidden="true">
        <rect width="30" height="30" rx="7" fill={app.color} />
        {app.glyph}
      </svg>
      <span className="store-demo__meta">
        <strong>{app.name}</strong>
        <small>{app.kind}</small>
      </span>
      <span className="store-demo__action">
        {stage === "get" && (
          <LiquidButton size="small" variant="secondary" className="store-demo__pill" onClick={() => { setValue(0); setStage("waiting"); }}>
            Get
          </LiquidButton>
        )}
        {stage === "waiting" && <LiquidProgressRing value={null} aria-label={`Waiting to download ${app.name}`} />}
        {stage === "loading" && (
          <button type="button" className="store-demo__stop" aria-label={`Stop downloading ${app.name}`} onClick={() => setStage("get")}>
            <LiquidProgressRing value={value} />
          </button>
        )}
        {stage === "open" && (
          <LiquidButton size="small" variant="secondary" className="store-demo__pill" onClick={() => toast.success(`Opened ${app.name}`)}>
            Open
          </LiquidButton>
        )}
      </span>
    </li>
  );
}

export function ProgressRingPreview() {
  return (
    <div className="progress-demo progress-demo--card">
      <ul className="store-demo" aria-label="Apps">
        {APPS.map((app) => (
          <AppRow key={app.name} app={app} />
        ))}
      </ul>
      <LiquidToaster />
    </div>
  );
}

export function SpinnerPreview() {
  return (
    <div className="progress-demo progress-demo--card">
      <div className="spinner-demo__row">
        <LiquidSpinner aria-label="Loading messages" />
        <span>Loading messages…</span>
      </div>
      <div className="spinner-demo__row">
        <LiquidButton size="small" variant="secondary" aria-busy="true">
          <LiquidSpinner size={16} aria-label="Saving" />
          Saving
        </LiquidButton>
        <LiquidSpinner size={36} aria-label="Loading" />
      </div>
    </div>
  );
}

/* Page control ------------------------------------------------------------ */

const MEMORIES = [
  { id: "1015", title: "Fjords", note: "Norway, 12 photos" },
  { id: "1043", title: "Valley walks", note: "California, 9 photos" },
  { id: "49", title: "Island light", note: "Greece, 21 photos" },
  { id: "1022", title: "Northern lights", note: "Iceland, 6 photos" },
];

export function PageControlPreview() {
  const [page, setPage] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  // While the carousel glides to a chosen page, the pages it passes are not choices.
  const heading = useRef<number | null>(null);
  const go = (next: number) => {
    setPage(next);
    heading.current = next;
    const element = track.current;
    element?.scrollTo({ left: next * element.clientWidth, behavior: reduced() ? "auto" : "smooth" });
  };
  return (
    <div className="pager-demo">
      <div
        ref={track}
        className="pager-demo__track"
        onScroll={(event) => {
          const element = event.currentTarget;
          const at = Math.round(element.scrollLeft / element.clientWidth);
          if (heading.current !== null) {
            if (at === heading.current && Math.abs(element.scrollLeft - at * element.clientWidth) < 2) heading.current = null;
            return;
          }
          setPage(at);
        }}
        onPointerDown={() => {
          heading.current = null;
        }}
      >
        {MEMORIES.map((memory) => (
          <figure key={memory.id} className="pager-demo__slide">
            <img src={`/photos/wide/${memory.id}.webp`} alt="" width={960} height={600} />
            <figcaption>
              <strong>{memory.title}</strong>
              <small>{memory.note}</small>
            </figcaption>
          </figure>
        ))}
      </div>
      <LiquidPageControl
        count={MEMORIES.length}
        value={page}
        onValueChange={go}
        aria-label="Memory"
        className="pager-demo__control"
        lens={{ refraction: 10 }}
      />
    </div>
  );
}

export function PageControlManyPreview() {
  const [page, setPage] = useState(2);
  return (
    <div className="pager-demo__stack">
      <LiquidPageControl count={8} value={page} onValueChange={setPage} aria-label="Home screen page" />
      <p className="pager-demo__readout" aria-live="polite">
        Page {page + 1} of 8
      </p>
    </div>
  );
}
