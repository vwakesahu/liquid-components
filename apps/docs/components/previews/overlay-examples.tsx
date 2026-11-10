"use client";

import { useEffect, useRef, useState } from "react";
import {
  BatteryFull,
  Bell,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Clock,
  Disc3,
  Folder,
  FolderPlus,
  Headphones,
  Hourglass,
  Image as ImageIcon,
  LoaderCircle,
  Moon,
  Pause,
  Phone,
  Play,
  Share,
  SkipBack,
  SkipForward,
  Square,
  Sun,
  Timer,
  Trash2,
  Users,
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import {
  LiquidAlert,
  LiquidAlertAction,
  LiquidAlertCancel,
  LiquidAlertContent,
  LiquidAlertInput,
  LiquidAlertTrigger,
  LiquidButton,
  LiquidDrawer,
  LiquidDrawerClose,
  LiquidDrawerContent,
  LiquidDrawerDescription,
  LiquidDrawerTitle,
  LiquidDrawerTrigger,
  LiquidIsland,
  LiquidSearchField,
  LiquidSwitch,
  LiquidTabs,
  LiquidTabsList,
  LiquidTabsTrigger,
  LiquidToaster,
  toast,
} from "@liquid-ui/core";

const stop = (action: () => void) => (event: React.MouseEvent) => {
  event.stopPropagation();
  action();
};
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/* Drawer ------------------------------------------------------------------ */

// App tiles drawn the way iOS draws them: one solid colour, one white glyph.
const APPS = [
  {
    name: "Messages",
    icon: (
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <rect width="60" height="60" rx="14" fill="#34c759" />
        <path d="M30 15c-9.4 0-17 6.1-17 13.6 0 4.3 2.5 8.1 6.4 10.6-.4 2.2-1.6 4.4-3.4 5.8 3.4.2 6.6-1 8.9-2.9 1.6.4 3.3.6 5.1.6 9.4 0 17-6.1 17-13.6S39.4 15 30 15Z" fill="#fff" />
      </svg>
    ),
  },
  {
    name: "Mail",
    icon: (
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <rect width="60" height="60" rx="14" fill="#1a8cff" />
        <rect x="12" y="18" width="36" height="25" rx="4" fill="#fff" />
        <path d="m13.5 20.5 16.5 12 16.5-12" fill="none" stroke="#1a8cff" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Notes",
    icon: (
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <rect width="60" height="60" rx="14" fill="#fff" />
        <path d="M0 14A14 14 0 0 1 14 0h32a14 14 0 0 1 14 14v4H0Z" fill="#ffd60a" />
        <path d="M12 29h36M12 37h36M12 45h22" stroke="#d4d4d8" strokeWidth="2.2" strokeLinecap="round" />
        <rect x=".5" y=".5" width="59" height="59" rx="13.5" fill="none" stroke="rgb(0 0 0 / .08)" />
      </svg>
    ),
  },
  {
    name: "Reminders",
    icon: (
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <rect width="60" height="60" rx="14" fill="#fff" />
        <circle cx="17" cy="20" r="4" fill="#0a84ff" />
        <circle cx="17" cy="30" r="4" fill="#ff3b30" />
        <circle cx="17" cy="40" r="4" fill="#ff9f0a" />
        <path d="M26 20h20M26 30h20M26 40h14" stroke="#d4d4d8" strokeWidth="2.2" strokeLinecap="round" />
        <rect x=".5" y=".5" width="59" height="59" rx="13.5" fill="none" stroke="rgb(0 0 0 / .08)" />
      </svg>
    ),
  },
];

// Avatars: DiceBear "Notionists" by Zoish, CC0.
const AVATAR = { maya: "/avatars/maya.svg", leo: "/avatars/leo.svg", ana: "/avatars/ana.svg" };

const PEOPLE = [
  { name: "Maya Kapoor", avatar: AVATAR.maya, role: "Owner" },
  { name: "Leo Hart", avatar: AVATAR.leo, role: "Joined in June" },
  { name: "Ana Ruiz", avatar: AVATAR.ana, role: "Joined in August" },
];

type DrawerView = "album" | "share" | "people" | "delete";

function DrawerHeader({ title, children, onBack }: { title: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <header className="drawer-demo__head">
      {onBack && (
        <button type="button" className="drawer-demo__close drawer-demo__back" aria-label="Back" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />
        </button>
      )}
      <div>
        <LiquidDrawerTitle>{title}</LiquidDrawerTitle>
        <LiquidDrawerDescription>{children}</LiquidDrawerDescription>
      </div>
      <LiquidDrawerClose className="drawer-demo__close" aria-label="Close">
        <X aria-hidden="true" />
      </LiquidDrawerClose>
    </header>
  );
}

export function DrawerPreview() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DrawerView>("album");
  const [outside, setOutside] = useState(true);
  const [copied, setCopied] = useState(false);
  const [canAdd, setCanAdd] = useState<Record<string, boolean>>({ "Leo Hart": true, "Ana Ruiz": false });
  const back = () => setView("album");

  return (
    <div className="drawer-demo">
      <LiquidDrawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setView("album");
            setCopied(false);
          }
        }}
      >
        <LiquidDrawerTrigger variant="outline">Album options</LiquidDrawerTrigger>
        <LiquidDrawerContent view={view} closeOnOutsideClick={outside}>
          {view === "album" && (
            <>
              <DrawerHeader title="Summer 2026">48 photos, shared with 3 people.</DrawerHeader>
              <div className="drawer-demo__rows">
                <button type="button" className="drawer-demo__row" onClick={() => setView("share")}>
                  <Share aria-hidden="true" />
                  <span>Share album</span>
                  <ChevronRight className="drawer-demo__chevron" aria-hidden="true" />
                </button>
                <button type="button" className="drawer-demo__row" onClick={() => setView("people")}>
                  <Users aria-hidden="true" />
                  <span>People</span>
                  <small>3</small>
                  <ChevronRight className="drawer-demo__chevron" aria-hidden="true" />
                </button>
                <button type="button" className="drawer-demo__row drawer-demo__row--danger" onClick={() => setView("delete")}>
                  <Trash2 aria-hidden="true" />
                  <span>Delete album</span>
                </button>
              </div>
            </>
          )}
          {view === "share" && (
            <>
              <DrawerHeader title="Share album" onBack={back}>Anyone with the link can view it.</DrawerHeader>
              <div className="drawer-demo__apps">
                {APPS.map((app) => (
                  <LiquidDrawerClose asChild key={app.name}>
                    <button type="button" className="drawer-demo__app" onClick={() => toast.success(`Sent with ${app.name}`)}>
                      {app.icon}
                      <span>{app.name}</span>
                    </button>
                  </LiquidDrawerClose>
                ))}
              </div>
              <div className="drawer-demo__link">
                <span>photos.example/s/summer-26</span>
                <LiquidButton size="small" variant="secondary" onClick={() => setCopied(true)}>
                  {copied ? "Copied" : "Copy"}
                </LiquidButton>
              </div>
            </>
          )}
          {view === "people" && (
            <>
              <DrawerHeader title="People" onBack={back}>Choose who can add photos.</DrawerHeader>
              <ul className="drawer-demo__people">
                {PEOPLE.map((person) => (
                  <li key={person.name}>
                    <img className="drawer-demo__avatar" src={person.avatar} alt="" width={36} height={36} />
                    <span>
                      <strong>{person.name}</strong>
                      <small>{person.role}</small>
                    </span>
                    {person.role !== "Owner" && (
                      <LiquidSwitch
                        size="small"
                        checked={canAdd[person.name]}
                        onCheckedChange={(value) => setCanAdd((current) => ({ ...current, [person.name]: value }))}
                        aria-label={`${person.name} can add photos`}
                      />
                    )}
                  </li>
                ))}
              </ul>
              <LiquidButton variant="secondary" size="large" className="drawer-demo__wide" onClick={back}>
                Done
              </LiquidButton>
            </>
          )}
          {view === "delete" && (
            <>
              <DrawerHeader title="Delete this album?" onBack={back}>
                The photos stay in your library. The 3 people you shared it with lose access.
              </DrawerHeader>
              <div className="drawer-demo__actions">
                <LiquidDrawerClose asChild>
                  <LiquidButton variant="destructive" size="large" className="drawer-demo__wide" onClick={() => toast.success("Album deleted")}>
                    Delete album
                  </LiquidButton>
                </LiquidDrawerClose>
                <LiquidButton variant="secondary" size="large" className="drawer-demo__wide" onClick={back}>
                  Go back
                </LiquidButton>
              </div>
            </>
          )}
        </LiquidDrawerContent>
      </LiquidDrawer>
      <label className="drawer-demo__option">
        Close on outside click
        <LiquidSwitch size="small" checked={outside} onCheckedChange={setOutside} aria-label="Close on outside click" />
      </label>
      <LiquidToaster />
    </div>
  );
}

export function DrawerRequiredPreview() {
  const [answer, setAnswer] = useState<string | null>(null);
  return (
    <div className="drawer-demo">
      <LiquidDrawer>
        <LiquidDrawerTrigger variant="outline">Set up backups</LiquidDrawerTrigger>
        <LiquidDrawerContent closeOnOutsideClick={false} closeOnDrag={false}>
          <span className="drawer-demo__badge drawer-demo__badge--blue" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 18h10.5a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 6.4 10.1 4 4 0 0 0 7 18Z" fill="currentColor" />
            </svg>
          </span>
          <LiquidDrawerTitle>Back up this phone?</LiquidDrawerTitle>
          <LiquidDrawerDescription>Photos, messages, and settings are saved each night while it charges.</LiquidDrawerDescription>
          <div className="drawer-demo__actions">
            <LiquidDrawerClose asChild>
              <LiquidButton variant="primary" size="large" className="drawer-demo__wide" onClick={() => setAnswer("Backups on")}>
                Turn on backups
              </LiquidButton>
            </LiquidDrawerClose>
            <LiquidDrawerClose asChild>
              <LiquidButton variant="secondary" size="large" className="drawer-demo__wide" onClick={() => setAnswer("Not now")}>
                Not now
              </LiquidButton>
            </LiquidDrawerClose>
          </div>
        </LiquidDrawerContent>
      </LiquidDrawer>
      <p className="drawer-demo__hint">{answer ?? "Click outside or drag it: it stays until you choose."}</p>
    </div>
  );
}

/* Alert ------------------------------------------------------------------- */

export function AlertPreview() {
  return (
    <>
      <LiquidAlert>
        <LiquidAlertTrigger variant="destructive">Delete album</LiquidAlertTrigger>
        <LiquidAlertContent title="Delete “Summer”?" description="This album and its 48 photos will be removed from all your devices.">
          <LiquidAlertCancel>Cancel</LiquidAlertCancel>
          <LiquidAlertAction destructive onClick={() => toast.success("Album deleted")}>Delete</LiquidAlertAction>
        </LiquidAlertContent>
      </LiquidAlert>
      <LiquidToaster />
    </>
  );
}

export function AlertStackedPreview() {
  const [choice, setChoice] = useState("not set");
  return (
    <div className="overlay-demo">
      <LiquidAlert>
        <LiquidAlertTrigger variant="outline">Use my location</LiquidAlertTrigger>
        <LiquidAlertContent title="Allow “Weather” to use your location?" description="It shows local forecasts and severe weather alerts.">
          <LiquidAlertAction onClick={() => setChoice("while using the app")}>Allow While Using App</LiquidAlertAction>
          <LiquidAlertAction variant="secondary" onClick={() => setChoice("once")}>Allow Once</LiquidAlertAction>
          <LiquidAlertCancel onClick={() => setChoice("denied")}>Don’t Allow</LiquidAlertCancel>
        </LiquidAlertContent>
      </LiquidAlert>
      <p className="overlay-demo__readout">Location access: {choice}</p>
    </div>
  );
}

export function AlertInputPreview() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [folders, setFolders] = useState(["Receipts", "Travel"]);
  const input = useRef<HTMLInputElement>(null);
  const save = () => {
    const value = name.trim();
    if (!value) return;
    setFolders((current) => [value, ...current.filter((folder) => folder !== value)]);
    setOpen(false);
  };
  return (
    <div className="overlay-demo">
      <LiquidAlert
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setName("");
        }}
      >
        <LiquidAlertTrigger variant="outline">
          <FolderPlus aria-hidden="true" />
          New folder
        </LiquidAlertTrigger>
        <LiquidAlertContent
          title="New Folder"
          description="Enter a name for this folder."
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
          body={
            <LiquidAlertInput
              ref={input}
              value={name}
              placeholder="Name"
              aria-label="Folder name"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") save();
              }}
            />
          }
        >
          <LiquidAlertCancel>Cancel</LiquidAlertCancel>
          <LiquidAlertAction
            disabled={!name.trim()}
            onClick={(event) => {
              event.preventDefault();
              save();
            }}
          >
            Save
          </LiquidAlertAction>
        </LiquidAlertContent>
      </LiquidAlert>
      <ul className="overlay-demo__folders" aria-label="Folders">
        {folders.map((folder) => (
          <li key={folder}>
            <Folder aria-hidden="true" />
            {folder}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AlertAsyncPreview() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(true);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div className="overlay-demo">
      <LiquidAlert open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        {signedIn ? (
          <LiquidAlertTrigger variant="outline">Sign out</LiquidAlertTrigger>
        ) : (
          <LiquidButton variant="outline" onClick={() => setSignedIn(true)}>
            Sign back in
          </LiquidButton>
        )}
        <LiquidAlertContent title="Sign out of your account?" description="Files that aren’t downloaded will be removed from this device.">
          <LiquidAlertCancel aria-disabled={busy || undefined} onClick={(event) => busy && event.preventDefault()}>
            Cancel
          </LiquidAlertCancel>
          <LiquidAlertAction
            destructive
            aria-busy={busy || undefined}
            onClick={(event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              timer.current = window.setTimeout(() => {
                setBusy(false);
                setOpen(false);
                setSignedIn(false);
                toast.success("Signed out");
              }, 1400);
            }}
          >
            {busy ? <LoaderCircle className="animate-spin" aria-label="Signing out" /> : "Sign Out"}
          </LiquidAlertAction>
        </LiquidAlertContent>
      </LiquidAlert>
      <p className="overlay-demo__readout">{signedIn ? "Signed in as maya@example.com" : "Signed out"}</p>
    </div>
  );
}

/* Search field ------------------------------------------------------------ */

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

const PLACES = ["Bangalore", "Barcelona", "Berlin", "Boston", "Brooklyn", "Lisbon", "London", "Los Angeles"];

export function SearchFieldPreview() {
  const [query, setQuery] = useState("");
  const results = query ? PLACES.filter((place) => place.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <div className="search-demo">
      <LiquidSearchField value={query} onValueChange={setQuery} placeholder="Search places" />
      <ul className="search-demo__results" aria-label="Results">
        {results.map((place) => (
          <li key={place}>
            <Highlight text={place} query={query} />
          </li>
        ))}
        {query && results.length === 0 && <li className="search-demo__empty">No results</li>}
      </ul>
    </div>
  );
}

// Companies get a logo mark, the way Mail shows a sender's brand.
const STUDIO_LOGO = (
  <svg viewBox="0 0 34 34" aria-hidden="true">
    <rect width="34" height="34" rx="17" fill="#111113" />
    <circle cx="14" cy="17" r="6" fill="#ff9f0a" />
    <circle cx="20" cy="17" r="6" fill="#fff" fillOpacity=".9" style={{ mixBlendMode: "difference" }} />
  </svg>
);
const BANK_LOGO = (
  <svg viewBox="0 0 34 34" aria-hidden="true">
    <rect width="34" height="34" rx="17" fill="#0b3d91" />
    <path d="M17 8.5 9 12.6v1.9h16v-1.9L17 8.5ZM10.5 16h2.6v6.5h-2.6V16Zm5.2 0h2.6v6.5h-2.6V16Zm5.2 0h2.6v6.5h-2.6V16ZM9 24h16v2H9v-2Z" fill="#fff" />
  </svg>
);

const MAIL = [
  { from: "Leo Hart", avatar: AVATAR.leo, subject: "Flights to Lisbon", box: "inbox", unread: true },
  { from: "Ana Ruiz", avatar: AVATAR.ana, subject: "Lisbon apartment photos", box: "inbox", unread: false },
  { from: "Northwind Studio", logo: STUDIO_LOGO, subject: "Your invoice for October", box: "inbox", unread: true },
  { from: "Maya Kapoor", avatar: AVATAR.maya, subject: "Re: Flights to Lisbon", box: "sent", unread: false },
  { from: "Maya Kapoor", avatar: AVATAR.maya, subject: "Lunch on Friday?", box: "sent", unread: false },
  { from: "Harbor Bank", logo: BANK_LOGO, subject: "Card ending 4021 was used", box: "inbox", unread: true },
];

export function SearchScopesPreview() {
  const [query, setQuery] = useState("Lisbon");
  const [scope, setScope] = useState("all");
  const results = MAIL.filter(
    (mail) =>
      (scope === "all" || (scope === "unread" ? mail.unread : mail.box === scope)) &&
      (!query || `${mail.from} ${mail.subject}`.toLowerCase().includes(query.toLowerCase())),
  );
  return (
    <div className="search-demo">
      <LiquidSearchField value={query} onValueChange={setQuery} placeholder="Search mail" />
      <LiquidTabs value={scope} onValueChange={setScope} className="search-demo__scopes">
        <LiquidTabsList aria-label="Mailbox">
          <LiquidTabsTrigger value="all">All</LiquidTabsTrigger>
          <LiquidTabsTrigger value="inbox">Inbox</LiquidTabsTrigger>
          <LiquidTabsTrigger value="sent">Sent</LiquidTabsTrigger>
          <LiquidTabsTrigger value="unread">Unread</LiquidTabsTrigger>
        </LiquidTabsList>
      </LiquidTabs>
      <ul className="search-demo__results search-demo__results--rich" aria-label="Results">
        {results.map((mail) => (
          <li key={`${mail.box}-${mail.subject}`}>
            {mail.logo ? (
              <span className="search-demo__avatar">{mail.logo}</span>
            ) : (
              <img className="search-demo__avatar" src={mail.avatar} alt="" width={34} height={34} />
            )}
            <span>
              <strong>
                <Highlight text={mail.subject} query={query} />
              </strong>
              <small>
                {mail.box === "sent" ? "To Leo Hart" : mail.from}
                {mail.unread && ", unread"}
              </small>
            </span>
          </li>
        ))}
        {results.length === 0 && <li className="search-demo__empty">No mail matches “{query}”</li>}
      </ul>
    </div>
  );
}

const SETTINGS = [
  { title: "Wi-Fi", path: "Settings", icon: Wifi, color: "#0a84ff" },
  { title: "Bluetooth", path: "Settings", icon: Bluetooth, color: "#0a84ff" },
  { title: "Battery Health", path: "Battery", icon: BatteryFull, color: "#34c759" },
  { title: "Night Shift", path: "Display & Brightness", icon: Sun, color: "#0a84ff" },
  { title: "Auto-Brightness", path: "Accessibility › Display", icon: Sun, color: "#0a84ff" },
  { title: "Do Not Disturb", path: "Focus", icon: Moon, color: "#5e5ce6" },
  { title: "Downtime", path: "Screen Time", icon: Hourglass, color: "#5e5ce6" },
  { title: "Notification Grouping", path: "Notifications", icon: Bell, color: "#ff3b30" },
  { title: "Ringtone", path: "Sounds & Haptics", icon: Volume2, color: "#ff2d55" },
  { title: "Wallpaper", path: "Settings", icon: ImageIcon, color: "#32ade6" },
];

export function SearchRecentsPreview() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recents, setRecents] = useState(["Night Shift", "Bluetooth", "Battery"]);
  const remember = (value: string) =>
    setRecents((current) => [value, ...current.filter((entry) => entry.toLowerCase() !== value.toLowerCase())].slice(0, 4));
  const results = query ? SETTINGS.filter((item) => `${item.title} ${item.path}`.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <div className="search-demo">
      <LiquidSearchField
        value={query}
        onValueChange={setQuery}
        placeholder="Search settings"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onCancel={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && query.trim()) remember(query.trim());
        }}
      />
      <ul className="search-demo__results search-demo__results--rich" aria-label={query ? "Results" : "Recent searches"}>
        {!query && focused && recents.length > 0 && (
          <>
            <li className="search-demo__section">
              Recent
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setRecents([])}>
                Clear
              </button>
            </li>
            {recents.map((recent) => (
              <li key={recent} className="search-demo__recent" onMouseDown={(event) => event.preventDefault()} onClick={() => setQuery(recent)}>
                <Clock aria-hidden="true" />
                <span>
                  <strong>{recent}</strong>
                </span>
              </li>
            ))}
          </>
        )}
        {results.map((item) => (
          <li key={item.title} className="search-demo__recent" onMouseDown={(event) => event.preventDefault()} onClick={() => remember(item.title)}>
            <span className="search-demo__tile" style={{ background: item.color }} aria-hidden="true">
              <item.icon />
            </span>
            <span>
              <strong>
                <Highlight text={item.title} query={query} />
              </strong>
              <small>{item.path}</small>
            </span>
          </li>
        ))}
        {query && results.length === 0 && <li className="search-demo__empty">No settings match “{query}”</li>}
      </ul>
    </div>
  );
}

/* Island ------------------------------------------------------------------ */

export function IslandPreview() {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(true);
  const [left, setLeft] = useState(5 * 60);
  const done = left === 0;
  useEffect(() => {
    if (!running || done) return;
    const id = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running, done]);
  const reset = () => {
    setLeft(5 * 60);
    setRunning(true);
    setExpanded(false);
  };
  return (
    <div className="island-demo">
      <LiquidIsland
        expanded={expanded}
        onExpandedChange={setExpanded}
        aria-label={`Timer, ${clock(left)} remaining`}
        leading={<Timer className="size-4 text-[#ff9f0a]" aria-hidden="true" />}
        trailing={<span className="text-[#ff9f0a]">{clock(left)}</span>}
      >
        <span className="island-demo__icon" aria-hidden="true">
          <Timer />
        </span>
        <span className="island-demo__meta">
          <small>{done ? "Done" : running ? "Timer" : "Paused"}</small>
          <strong>{clock(left)}</strong>
        </span>
        <span className="island-demo__controls">
          <button type="button" aria-label={running ? "Pause" : "Resume"} disabled={done} onClick={stop(() => setRunning((value) => !value))}>
            {running ? <Pause /> : <Play />}
          </button>
          <button type="button" aria-label="Reset" onClick={stop(reset)}>
            <Square />
          </button>
        </span>
      </LiquidIsland>
      <p className="island-demo__hint">Tap the island</p>
    </div>
  );
}

function Wave({ playing }: { playing: boolean }) {
  return (
    <span className="island-demo__wave" data-paused={!playing || undefined} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

const TRACK_LENGTH = 214;

export function IslandMusicPreview() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(48);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setElapsed((value) => (value + 1) % TRACK_LENGTH), 1000);
    return () => window.clearInterval(id);
  }, [playing]);
  return (
    <div className="island-demo">
      <LiquidIsland
        expanded={expanded}
        onExpandedChange={setExpanded}
        expandedSize={{ width: 360, height: 172 }}
        aria-label={`Now playing: Slow Light, Mira Vale${playing ? "" : ", paused"}`}
        leading={
          <span className="island-demo__art" aria-hidden="true">
            <Disc3 />
          </span>
        }
        trailing={<Wave playing={playing} />}
      >
        <div className="island-demo__player">
          <div className="island-demo__track">
            <span className="island-demo__art island-demo__art--large" aria-hidden="true">
              <Disc3 />
            </span>
            <span>
              <strong>Slow Light</strong>
              <small>Mira Vale</small>
            </span>
            <Wave playing={playing} />
          </div>
          <div className="island-demo__progress">
            <span>{clock(elapsed)}</span>
            <span className="island-demo__bar">
              <i style={{ width: `${(elapsed / TRACK_LENGTH) * 100}%` }} />
            </span>
            <span>-{clock(TRACK_LENGTH - elapsed)}</span>
          </div>
          <div className="island-demo__transport">
            <button type="button" aria-label="Previous" onClick={stop(() => setElapsed(0))}>
              <SkipBack />
            </button>
            <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={stop(() => setPlaying((value) => !value))}>
              {playing ? <Pause /> : <Play />}
            </button>
            <button type="button" aria-label="Next" onClick={stop(() => setElapsed(0))}>
              <SkipForward />
            </button>
          </div>
        </div>
      </LiquidIsland>
      <p className="island-demo__hint">Tap to open the player</p>
    </div>
  );
}

type Call = "idle" | "ringing" | "active";
const IDLE = { width: 126, height: 37 };

export function IslandCallPreview() {
  const [call, setCall] = useState<Call>("idle");
  const [expanded, setExpanded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (call !== "active") return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [call]);
  const ring = () => {
    setCall("ringing");
    setExpanded(true);
  };
  const accept = () => {
    setSeconds(0);
    setCall("active");
    setExpanded(false);
  };
  const end = () => {
    setCall("idle");
    setExpanded(false);
  };
  return (
    <div className="island-demo">
      <LiquidIsland
        expanded={expanded}
        onExpandedChange={(next) => call === "active" && setExpanded(next)}
        compactSize={call === "idle" ? IDLE : undefined}
        aria-label={call === "ringing" ? "Incoming call from Maya Kapoor" : call === "active" ? `On a call, ${clock(seconds)}` : "Dynamic Island"}
        leading={call === "active" && <Phone className="size-4 fill-[#34c759] text-[#34c759]" aria-hidden="true" />}
        trailing={call === "active" && <span className="text-[#34c759]">{clock(seconds)}</span>}
      >
        <img className="island-demo__avatar" src={AVATAR.maya} alt="" width={44} height={44} />
        <span className="island-demo__meta island-demo__meta--plain">
          <small>{call === "ringing" ? "mobile" : clock(seconds)}</small>
          <strong>Maya Kapoor</strong>
        </span>
        <span className="island-demo__controls">
          {call === "ringing" && (
            <button type="button" className="island-demo__round island-demo__round--decline" aria-label="Decline" onClick={stop(end)}>
              <Phone />
            </button>
          )}
          <button
            type="button"
            className={call === "ringing" ? "island-demo__round island-demo__round--accept" : "island-demo__round island-demo__round--decline"}
            aria-label={call === "ringing" ? "Accept" : "End call"}
            onClick={stop(call === "ringing" ? accept : end)}
          >
            <Phone />
          </button>
        </span>
      </LiquidIsland>
      <LiquidButton size="small" variant="outline" disabled={call !== "idle"} onClick={ring}>
        Simulate a call
      </LiquidButton>
    </div>
  );
}

function Battery({ value, label }: { value: number; label: string }) {
  return (
    <span className="island-demo__cell" role="img" aria-label={`${label} ${value}%`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(255 255 255 / .18)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="#34c759"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${value} 100`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <b aria-hidden="true">{label}</b>
    </span>
  );
}

export function IslandConnectPreview() {
  const [expanded, setExpanded] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const connect = () => {
    setExpanded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setExpanded(false), 2800);
  };
  return (
    <div className="island-demo">
      <LiquidIsland
        expanded={expanded}
        onExpandedChange={setExpanded}
        compactSize={IDLE}
        expandedSize={{ width: 340, height: 76 }}
        aria-label={expanded ? "Earbuds connected" : "Dynamic Island"}
      >
        <span className="island-demo__icon island-demo__icon--white" aria-hidden="true">
          <Headphones />
        </span>
        <span className="island-demo__meta island-demo__meta--plain">
          <small>Connected</small>
          <strong>Kai’s Earbuds</strong>
        </span>
        <span className="island-demo__battery">
          <Battery value={82} label="L" />
          <Battery value={64} label="R" />
        </span>
      </LiquidIsland>
      <LiquidButton size="small" variant="outline" onClick={connect}>
        Connect earbuds
      </LiquidButton>
    </div>
  );
}
