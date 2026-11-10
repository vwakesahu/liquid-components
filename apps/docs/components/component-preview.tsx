"use client";

import { useEffect, useRef, useState } from "react";

import { BrowserToolbarPreview } from "./previews/browser-toolbar";
import { MenuDeletePreview } from "./previews/menu-delete";
import {
  ContextMenuLinkPreview,
  ContextMenuPreview,
  PageControlManyPreview,
  PageControlPreview,
  ProgressPreview,
  ProgressRingPreview,
  ProgressUploadPreview,
  SpinnerPreview,
  TabBarBadgesPreview,
  TabBarPreview,
  TooltipPreview,
} from "./previews/more-examples";
import {
  AlertAsyncPreview,
  AlertInputPreview,
  AlertPreview,
  AlertStackedPreview,
  DrawerPreview,
  DrawerRequiredPreview,
  IslandCallPreview,
  IslandConnectPreview,
  IslandMusicPreview,
  IslandPreview,
  SearchFieldPreview,
  SearchRecentsPreview,
  SearchScopesPreview,
} from "./previews/overlay-examples";
import {
  StepperCartPreview,
  StepperSettingsPreview,
  WheelControlledPreview,
  WheelDatePreview,
  WheelRepeatPreview,
  WheelTimerPreview,
} from "./previews/picker-examples";

import {
  LiquidPopover,
  LiquidPopoverClose,
  LiquidPopoverContent,
  LiquidPopoverTrigger,
  LiquidStepper,
  LiquidToaster,
  LiquidWheel,
  LiquidWheelPicker,
  toast,
  LiquidButton,
  LiquidGlass,
  LiquidGlassGroup,
  LiquidMenu,
  LiquidMenuContent,
  LiquidMenuItem,
  LiquidMenuLabel,
  LiquidMenuSeparator,
  LiquidMenuShortcut,
  LiquidMenuTrigger,
  LiquidSlider,
  LiquidSwitch,
  LiquidTabs,
  LiquidTabsContent,
  LiquidTabsList,
  LiquidTabsTrigger,
  LiquidVideoPlayer,
  type LiquidButtonStatus,
} from "@liquid-ui/core";
import {
  ArrowRight,
  Copy,
  Ellipsis,
  SlidersHorizontal,
  Wifi,
  Minus,
  Plus,
  Pencil,
  Share,
  Trash2,
  WandSparkles,
} from "lucide-react";

type PreviewName =
  | "button"
  | "button-variants"
  | "button-sizes"
  | "button-status"
  | "switch"
  | "slider"
  | "slider-sizes"
  | "tabs"
  | "video"
  | "button-glass"
  | "glass"
  | "glass-group"
  | "toolbar"
  | "menu"
  | "popover"
  | "toast"
  | "stepper"
  | "wheel-picker"
  | "wheel-date"
  | "wheel-timer"
  | "wheel-repeat"
  | "wheel-controlled"
  | "stepper-cart"
  | "stepper-settings"
  | "drawer"
  | "drawer-required"
  | "alert"
  | "alert-stacked"
  | "alert-input"
  | "alert-async"
  | "search-field"
  | "search-scopes"
  | "search-recents"
  | "island"
  | "island-music"
  | "island-call"
  | "island-connect"
  | "tab-bar"
  | "tab-bar-badges"
  | "context-menu"
  | "context-menu-link"
  | "tooltip"
  | "progress"
  | "progress-upload"
  | "progress-ring"
  | "spinner"
  | "page-control"
  | "page-control-many";

// Controls sit on a white stage; glass and full scenes sit straight on the grid.
const bareNames = new Set<PreviewName>(["tab-bar", "tab-bar-badges", "context-menu", "context-menu-link", "tooltip", "progress-upload", "progress-ring", "spinner", "page-control", "page-control-many", "drawer", "drawer-required", "alert", "alert-stacked", "alert-input", "alert-async", "search-field", "search-scopes", "search-recents", "island", "island-music", "island-call", "island-connect", "stepper-cart", "stepper-settings", "toolbar", "menu", "popover", "toast", "video", "button-variants", "button-status", "glass", "glass-group", "button-glass"]);

// Glass needs a scene to bend, so these previews sit on a photograph (credited on the credits page).
const photoCanvas: Partial<Record<PreviewName, string>> = {
  glass: "1018",
  "glass-group": "1050",
  "button-glass": "1036",
  tooltip: "1015",
  "page-control-many": "1036",
};

function Stage({ bare, children }: { bare: boolean; children: React.ReactNode }) {
  if (bare) return <>{children}</>;
  return <div className="component-preview__stage">{children}</div>;
}

export function ComponentPreview({ name }: { name: PreviewName }) {
  const [switchValue, setSwitchValue] = useState(true);
  const [sliderValue, setSliderValue] = useState([62]);
  const [errorStatus, setErrorStatus] = useState<LiquidButtonStatus>("idle");
  const [successStatus, setSuccessStatus] = useState<LiquidButtonStatus>("idle");
  const [merged, setMerged] = useState(false);
  const errorTimer = useRef<number | null>(null);
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
      if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    };
  }, []);

  const runFailedAction = () => {
    if (errorStatus === "loading") return;
    if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
    setErrorStatus("loading");
    errorTimer.current = window.setTimeout(() => {
      setErrorStatus("error");
      errorTimer.current = null;
    }, 1350);
  };

  const runSuccessfulAction = () => {
    if (successStatus === "loading") return;
    if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    setSuccessStatus("loading");
    successTimer.current = window.setTimeout(() => {
      setSuccessStatus("success");
      successTimer.current = null;
    }, 1350);
  };

  return (
    <div
      className="component-preview"
      data-preview={name}
      data-canvas={photoCanvas[name] ? "photo" : undefined}
      style={photoCanvas[name] ? ({ "--canvas-photo": `url(/photos/wide/${photoCanvas[name]}.webp)` } as React.CSSProperties) : undefined}
    >
      <div className="component-preview__canvas">
        <Stage bare={bareNames.has(name)}>
        {name === "button-glass" && (
          <div className="component-preview__row">
            <LiquidButton variant="glass">Glass</LiquidButton>
            <LiquidButton variant="glass" size="large"><WandSparkles aria-hidden="true" />Create</LiquidButton>
          </div>
        )}
        {name === "glass" && (
          <LiquidGlass className="component-preview__glass-card">
            Brightness
            <LiquidSlider size="small" tint="#0a0a0a" defaultValue={[64]} aria-label="Brightness" />
          </LiquidGlass>
        )}
        {name === "glass-group" && (
          <div className="component-preview__stack">
            <LiquidGlassGroup merge={14} className="component-preview__glass-pair">
              <LiquidGlass className="component-preview__glass-pill" style={{ left: 26, translate: merged ? "24px 0" : "0 0" }} aria-label="Zoom out">
                <Minus aria-hidden="true" />
              </LiquidGlass>
              <LiquidGlass className="component-preview__glass-pill" style={{ left: 162, translate: merged ? "-24px 0" : "0 0" }} aria-label="Zoom in">
                <Plus aria-hidden="true" />
              </LiquidGlass>
            </LiquidGlassGroup>
            <LiquidButton size="small" variant="outline" onClick={() => setMerged((value) => !value)}>
              {merged ? "Split" : "Join"}
            </LiquidButton>
          </div>
        )}
        {name === "toolbar" && <BrowserToolbarPreview />}
        {name === "menu" && <MenuDeletePreview />}
        {name === "popover" && (
          <LiquidPopover>
            <LiquidPopoverTrigger variant="outline"><SlidersHorizontal aria-hidden="true" />Display</LiquidPopoverTrigger>
            <LiquidPopoverContent>
              <div className="component-preview__popover">
                <strong>Display</strong>
                <label>Brightness<LiquidSlider size="small" tint="#0a0a0a" defaultValue={[70]} aria-label="Brightness" /></label>
                <label className="component-preview__popover-row">Night Shift<LiquidSwitch size="small" aria-label="Night Shift" /></label>
                <LiquidPopoverClose asChild><LiquidButton size="small" variant="outline">Done</LiquidButton></LiquidPopoverClose>
              </div>
            </LiquidPopoverContent>
          </LiquidPopover>
        )}
        {name === "toast" && (
          <div className="component-preview__row component-preview__row--wrap">
            <LiquidButton variant="outline" onClick={() => toast.success({ title: "Saved to Photos", description: "IMG_2048.heic" })}>
              Success
            </LiquidButton>
            <LiquidButton
              variant="outline"
              onClick={() =>
                toast({
                  title: "Wi-Fi disconnected",
                  description: "Reconnecting to Home",
                  icon: <Wifi />,
                  action: { label: "Retry", onClick: () => toast.info("Connected to Home") },
                })
              }
            >
              With action
            </LiquidButton>
            <LiquidButton
              variant="outline"
              onClick={() =>
                toast.promise(new Promise((resolve) => window.setTimeout(resolve, 1600)), {
                  loading: "Uploading 3 photos…",
                  success: "Uploaded to iCloud",
                  error: "Upload failed",
                })
              }
            >
              Promise
            </LiquidButton>
            <LiquidToaster />
          </div>
        )}
        {name === "drawer" && <DrawerPreview />}
        {name === "drawer-required" && <DrawerRequiredPreview />}
        {name === "alert" && <AlertPreview />}
        {name === "alert-stacked" && <AlertStackedPreview />}
        {name === "alert-input" && <AlertInputPreview />}
        {name === "alert-async" && <AlertAsyncPreview />}
        {name === "search-field" && <SearchFieldPreview />}
        {name === "search-scopes" && <SearchScopesPreview />}
        {name === "search-recents" && <SearchRecentsPreview />}
        {name === "island" && <IslandPreview />}
        {name === "island-music" && <IslandMusicPreview />}
        {name === "island-call" && <IslandCallPreview />}
        {name === "island-connect" && <IslandConnectPreview />}
        {name === "tab-bar" && <TabBarPreview />}
        {name === "tab-bar-badges" && <TabBarBadgesPreview />}
        {name === "context-menu" && <ContextMenuPreview />}
        {name === "context-menu-link" && <ContextMenuLinkPreview />}
        {name === "tooltip" && <TooltipPreview />}
        {name === "progress" && <ProgressPreview />}
        {name === "progress-upload" && <ProgressUploadPreview />}
        {name === "progress-ring" && <ProgressRingPreview />}
        {name === "spinner" && <SpinnerPreview />}
        {name === "page-control" && <PageControlPreview />}
        {name === "page-control-many" && <PageControlManyPreview />}
        {name === "wheel-date" && <WheelDatePreview />}
        {name === "wheel-timer" && <WheelTimerPreview />}
        {name === "wheel-repeat" && <WheelRepeatPreview />}
        {name === "wheel-controlled" && <WheelControlledPreview />}
        {name === "stepper-cart" && <StepperCartPreview />}
        {name === "stepper-settings" && <StepperSettingsPreview />}
        {name === "wheel-picker" && (
          <LiquidWheelPicker aria-label="Alarm time" className="component-preview__wheel">
            <LiquidWheel aria-label="Hour" options={Array.from({ length: 12 }, (_, i) => String(i + 1))} defaultValue="7" />
            <LiquidWheel aria-label="Minute" options={Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))} defaultValue="30" />
            <LiquidWheel aria-label="Period" options={["AM", "PM"]} defaultValue="AM" />
          </LiquidWheelPicker>
        )}
        {name === "stepper" && (
          <div className="component-preview__row">
            <LiquidStepper defaultValue={2} min={0} max={10} aria-label="Guests" />
            <LiquidStepper defaultValue={50} min={0} max={100} step={5} format={(value) => `${value}%`} aria-label="Volume" />
            <LiquidStepper defaultValue={1} min={0} showValue={false} aria-label="Quantity" />
          </div>
        )}
        {name === "button" && (
          <LiquidButton>Button</LiquidButton>
        )}
        {name === "button-variants" && (
          <div className="component-preview__button-grid">
            <div><span>Default</span><LiquidButton>Button</LiquidButton></div>
            <div><span>Primary</span><LiquidButton variant="primary">Primary</LiquidButton></div>
            <div><span>Destructive</span><LiquidButton variant="destructive"><Trash2 aria-hidden="true" />Delete</LiquidButton></div>
            <div><span>Outline</span><LiquidButton variant="outline">Outline</LiquidButton></div>
            <div><span>Ghost</span><LiquidButton variant="ghost">Ghost</LiquidButton></div>
            <div><span>Link</span><LiquidButton variant="link">Learn more<ArrowRight aria-hidden="true" /></LiquidButton></div>
          </div>
        )}
        {name === "button-sizes" && (
          <div className="component-preview__button-size-row">
            <LiquidButton size="small">Small</LiquidButton>
            <LiquidButton>Regular</LiquidButton>
            <LiquidButton size="large">Large</LiquidButton>
          </div>
        )}
        {name === "button-status" && (
          <div className="component-preview__button-status-grid">
            <div>
              <span>Success</span>
              <LiquidButton
                variant="status"
                status={successStatus}
                successLabel="Saved"
                onClick={runSuccessfulAction}
              >
                <WandSparkles aria-hidden="true" />
                Test success
              </LiquidButton>
            </div>
            <div>
              <span>Error</span>
              <LiquidButton
                variant="status"
                status={errorStatus}
                errorLabel="Try again"
                onClick={runFailedAction}
              >
                <WandSparkles aria-hidden="true" />
                Test error
              </LiquidButton>
            </div>
          </div>
        )}
        {name === "switch" && (
          <div className="component-preview__row">
            <LiquidSwitch checked={switchValue} onCheckedChange={setSwitchValue} tint="var(--liquid-accent)" aria-label="Preview switch" />
            <LiquidSwitch size="large" defaultChecked aria-label="Large preview switch" />
            <LiquidSwitch disabled defaultChecked aria-label="Disabled preview switch" />
          </div>
        )}
        {name === "slider" && (
          <div className="component-preview__slider">
            <LiquidSlider value={sliderValue} onValueChange={setSliderValue} aria-label="Preview slider" />
          </div>
        )}
        {name === "slider-sizes" && (
          <div className="component-preview__slider-sizes">
            <div><span>Small</span><LiquidSlider size="small" defaultValue={[36]} aria-label="Small slider" /></div>
            <div><span>Regular</span><LiquidSlider defaultValue={[52]} aria-label="Regular slider" /></div>
            <div><span>Large</span><LiquidSlider size="large" defaultValue={[68]} aria-label="Large slider" /></div>
            <div><span>Custom</span><LiquidSlider trackerSize={{ width: 58, height: 34, trackHeight: 9 }} defaultValue={[44]} aria-label="Custom slider" /></div>
          </div>
        )}
        {name === "tabs" && (
          <div className="component-preview__tabs">
            <LiquidTabs defaultValue="overview">
              <LiquidTabsList aria-label="Preview sections">
                <LiquidTabsTrigger value="overview">Overview</LiquidTabsTrigger>
                <LiquidTabsTrigger value="activity">Activity</LiquidTabsTrigger>
                <LiquidTabsTrigger value="insights">Insights</LiquidTabsTrigger>
              </LiquidTabsList>
              <LiquidTabsContent value="overview">Drag across the track to change selection.</LiquidTabsContent>
              <LiquidTabsContent value="activity">The indicator follows with spring motion.</LiquidTabsContent>
              <LiquidTabsContent value="insights">The selected label stays readable.</LiquidTabsContent>
            </LiquidTabs>
          </div>
        )}
        {name === "video" && (
          <div className="component-preview__video">
            <LiquidVideoPlayer
              src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
              crossOrigin="anonymous"
              aria-label="Flower video preview"
            />
          </div>
        )}
        </Stage>
      </div>
    </div>
  );
}
