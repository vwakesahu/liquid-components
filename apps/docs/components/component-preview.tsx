"use client";

import { useState } from "react";

import {
  LiquidSlider,
  LiquidSwitch,
  LiquidTabs,
  LiquidTabsContent,
  LiquidTabsList,
  LiquidTabsTrigger,
  LiquidVideoPlayer,
} from "@liquid-ui/core";

type PreviewName = "switch" | "slider" | "tabs" | "video";

export function ComponentPreview({ name }: { name: PreviewName }) {
  const [switchValue, setSwitchValue] = useState(true);
  const [sliderValue, setSliderValue] = useState([62]);

  return (
    <div className="component-preview">
      <div className="component-preview__canvas">
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
