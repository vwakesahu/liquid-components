"use client";

import { useEffect, useRef, useState } from "react";

import {
  LiquidButton,
  LiquidSlider,
  LiquidSwitch,
  LiquidTabs,
  LiquidTabsContent,
  LiquidTabsList,
  LiquidTabsTrigger,
  LiquidVideoPlayer,
  type LiquidButtonStatus,
} from "@liquid-ui/core";
import { ArrowRight, Trash2, WandSparkles } from "lucide-react";

type PreviewName =
  | "button"
  | "button-variants"
  | "button-sizes"
  | "button-status"
  | "switch"
  | "slider"
  | "slider-sizes"
  | "tabs"
  | "video";

export function ComponentPreview({ name }: { name: PreviewName }) {
  const [switchValue, setSwitchValue] = useState(true);
  const [sliderValue, setSliderValue] = useState([62]);
  const [errorStatus, setErrorStatus] = useState<LiquidButtonStatus>("idle");
  const [successStatus, setSuccessStatus] = useState<LiquidButtonStatus>("idle");
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
    <div className="component-preview" data-preview={name}>
      <div className="component-preview__canvas">
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
            <LiquidSwitch checked={switchValue} onCheckedChange={setSwitchValue} aria-label="Preview switch" />
            <LiquidSwitch size="large" tint="#0a84ff" defaultChecked aria-label="Large preview switch" />
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
      </div>
    </div>
  );
}
