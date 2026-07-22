import { BookOpen, Component, MousePointer2, Play, SlidersHorizontal, Sparkles, ToggleLeft } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export interface ListItem {
  title: string;
  href: string;
  icon: Icon;
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
      { title: "Switch", href: "/docs/components/switch", icon: ToggleLeft },
      { title: "Slider", href: "/docs/components/slider", icon: SlidersHorizontal },
      { title: "Tabs", href: "/docs/components/tabs", icon: Component },
      { title: "Video player", href: "/docs/components/video-player", icon: Play },
    ],
  },
];
