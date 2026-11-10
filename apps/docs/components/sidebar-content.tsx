import { BookOpen, Component, Droplet, Heart, List, MousePointer2, PanelTop, Play, RectangleEllipsis, SlidersHorizontal, Sparkles, ToggleLeft } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export interface ListItem {
  title: string;
  href?: string;
  icon: Icon;
  group?: boolean;
  separator?: boolean;
  isNew?: boolean;
}

export interface Section {
  title: string;
  Icon: Icon;
  list: ListItem[];
}

export const contents: Section[] = [
  {
    title: "Get started",
    Icon: Sparkles,
    list: [
      { title: "Overview", href: "/docs", icon: BookOpen },
      { title: "Installation", href: "/docs/installation", icon: MousePointer2 },
      { title: "Credits", href: "/docs/credits", icon: Heart },
    ],
  },
  {
    title: "Foundations",
    Icon: Component,
    list: [
      { title: "Material and motion", href: "/docs/foundations/material", icon: Sparkles },
    ],
  },
  {
    title: "Components",
    Icon: Component,
    list: [
      { title: "Button", href: "/docs/components/button", icon: RectangleEllipsis },
      { title: "Switch", href: "/docs/components/switch", icon: ToggleLeft },
      { title: "Slider", href: "/docs/components/slider", icon: SlidersHorizontal },
      { title: "Stepper", href: "/docs/components/stepper", icon: SlidersHorizontal },
      { title: "Wheel picker", href: "/docs/components/wheel-picker", icon: SlidersHorizontal, isNew: true },
      { title: "Tabs", href: "/docs/components/tabs", icon: Component },
      { title: "Tab bar", href: "/docs/components/tab-bar", icon: Component, isNew: true },
      { title: "Page control", href: "/docs/components/page-control", icon: Component, isNew: true },
      { title: "Progress", href: "/docs/components/progress", icon: SlidersHorizontal, isNew: true },
      { title: "Glass", href: "/docs/components/glass", icon: Droplet, isNew: true },
      { title: "Toolbar", href: "/docs/components/toolbar", icon: PanelTop, isNew: true },
      { title: "Menu", href: "/docs/components/menu", icon: List, isNew: true },
      { title: "Context menu", href: "/docs/components/context-menu", icon: List, isNew: true },
      { title: "Popover", href: "/docs/components/popover", icon: List, isNew: true },
      { title: "Tooltip", href: "/docs/components/tooltip", icon: List, isNew: true },
      { title: "Toast", href: "/docs/components/toast", icon: List, isNew: true },
      { title: "Drawer", href: "/docs/components/drawer", icon: List, isNew: true },
      { title: "Alert", href: "/docs/components/alert", icon: List, isNew: true },
      { title: "Search field", href: "/docs/components/search-field", icon: List, isNew: true },
      { title: "Dynamic Island", href: "/docs/components/island", icon: List, isNew: true },
      { title: "Video player", href: "/docs/components/video-player", icon: Play },
    ],
  },
];
