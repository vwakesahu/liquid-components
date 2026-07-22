import { useState } from "react";
import { Check, Clipboard, ExternalLink, Moon, Sun } from "lucide-react";
import { LiquidSwitch } from "./components/glass-switch";
import { LiquidSlider } from "./components/liquid-slider";

const sourceExample = `import { LiquidSwitch } from "@/components/liquid-switch"

export function SettingsRow() {
  const [isOn, setIsOn] = useState(true)

  return (
    <LiquidSwitch
      checked={isOn}
      onCheckedChange={setIsOn}
      aria-label="Automatic updates"
    />
  )
}`;

function CopyCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className="copy-code" onClick={copy}>
      {copied ? <Check size={14} /> : <Clipboard size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SettingsRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = title.toLowerCase().replaceAll(" ", "-");
  return (
    <div className="settings-row">
      <div>
        <span id={id}>{title}</span>
        {description && <small>{description}</small>}
      </div>
      <LiquidSwitch checked={value} onCheckedChange={onChange} aria-labelledby={id} />
    </div>
  );
}

function App() {
  const [automatic, setAutomatic] = useState(true);
  const [downloads, setDownloads] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [dark, setDark] = useState(false);
  const [volume, setVolume] = useState(68);
  const [brightness, setBrightness] = useState(42);

  return (
    <div className="app" data-theme={dark ? "dark" : "light"}>
      <header>
        <a href="#top" className="wordmark">liquid<span>.ui</span></a>
        <nav>
          <a className="active" href="#component">Switch</a>
          <a href="#slider">Slider</a>
          <a href="#anatomy">Anatomy</a>
          <a href="#source">React</a>
        </nav>
        <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      <main id="top">
        <section className="intro">
          <p className="kicker">APPLE COMPONENT STUDY · 001</p>
          <h1>Switch, translated<br />for the web.</h1>
          <p className="lede">
            A React primitive studying the behavior of Apple’s iOS 26 switch:
            quiet at rest, fluid under your finger, and glass only when it matters.
          </p>
          <div className="source-links">
            <a href="https://developer.apple.com/videos/play/wwdc2025/323/" target="_blank" rel="noreferrer">
              Apple’s controls session <ExternalLink size={13} />
            </a>
            <a href="https://developer.apple.com/design/human-interface-guidelines/toggles" target="_blank" rel="noreferrer">
              Toggle HIG <ExternalLink size={13} />
            </a>
          </div>
        </section>

        <section className="hero-demo" id="component">
          <div className="color-field color-field-a" />
          <div className="color-field color-field-b" />
          <div className="phone-frame">
            <div className="dynamic-island" />
            <div className="phone-title">
              <span>Settings</span>
              <h2>App Store</h2>
            </div>
            <div className="settings-group">
              <SettingsRow title="App Updates" value={updates} onChange={setUpdates} />
              <SettingsRow title="App Downloads" value={downloads} onChange={setDownloads} />
            </div>
            <h3>AUTOMATIC DOWNLOADS</h3>
            <div className="settings-group">
              <SettingsRow
                title="In-App Content"
                description="Run apps in the background to download content before you first launch them."
                value={automatic}
                onChange={setAutomatic}
              />
            </div>
            <p className="gesture-hint">Press and drag the switches</p>
            <div className="home-indicator" />
          </div>
        </section>

        <section className="apple-reference">
          <div>
            <p className="kicker">APPLE’S BASELINE</p>
            <h2>Start with the system control.</h2>
            <p>In SwiftUI, there is no custom glass recipe for this. Build the standard toggle with the iOS 26 SDK and the system supplies the new material and interaction automatically. Our web version translates that behavior, not private Apple rendering code.</p>
          </div>
          <div className="swift-code">
            <span>SwiftUI</span>
            <code>{`Toggle("App Updates", isOn: $appUpdates)\n    .toggleStyle(.switch)`}</code>
          </div>
        </section>

        <section className="behavior-strip">
          <article>
            <span>01</span>
            <h3>Rest</h3>
            <p>Opaque thumb, flat system tint, minimal visual noise.</p>
            <LiquidSwitch defaultChecked aria-label="Resting switch example" />
          </article>
          <article className="forced-interaction">
            <span>02</span>
            <h3>Engage</h3>
            <p>The thumb lifts, widens, catches light, and reveals its lens.</p>
            <div className="interaction-visual" aria-hidden="true">
              <span className="interaction-track"><i /></span>
            </div>
          </article>
          <article>
            <span>03</span>
            <h3>Settle</h3>
            <p>Spring motion resolves quickly into a familiar binary state.</p>
            <LiquidSwitch aria-label="Settled switch example" />
          </article>
        </section>

        <section className="anatomy" id="anatomy">
          <div className="section-copy">
            <p className="kicker">ANATOMY</p>
            <h2>One control.<br />Four optical layers.</h2>
            <p>Apple’s material is proprietary. This web translation recreates the observable behavior with native browser layers while preserving semantic switch behavior.</p>
          </div>
          <div className="exploded">
            <div className="exploded-part part-light"><i /><b>04</b><span>Interaction light</span></div>
            <div className="exploded-part part-rim"><i /><b>03</b><span>Specular rim</span></div>
            <div className="exploded-part part-lens"><i /><b>02</b><span>Adaptive lens</span></div>
            <div className="exploded-part part-track"><i /><b>01</b><span>State track</span></div>
          </div>
        </section>

        <section className="playground">
          <div>
            <p className="kicker">SIZES & STATES</p>
            <h2>Systematic, not decorative.</h2>
          </div>
          <div className="playground-grid">
            <div><span>Small</span><LiquidSwitch size="small" defaultChecked aria-label="Small switch" /></div>
            <div><span>Regular</span><LiquidSwitch defaultChecked aria-label="Regular switch" /></div>
            <div><span>Large</span><LiquidSwitch size="large" defaultChecked aria-label="Large switch" /></div>
            <div><span>Off</span><LiquidSwitch aria-label="Off switch" /></div>
            <div><span>Custom tint</span><LiquidSwitch tint="#0a84ff" defaultChecked aria-label="Blue switch" /></div>
            <div><span>Disabled</span><LiquidSwitch disabled defaultChecked aria-label="Disabled switch" /></div>
          </div>
        </section>

        <section className="source" id="source">
          <div className="source-heading">
            <div>
              <p className="kicker">REACT + TYPESCRIPT</p>
              <h2>Copy it. Own it.</h2>
            </div>
            <p>Controlled or uncontrolled, form-compatible, keyboard accessible, draggable, and reduced-motion aware.</p>
          </div>
          <div className="code-window">
            <div className="code-bar"><span>usage.tsx</span><CopyCode value={sourceExample} /></div>
            <pre><code>{sourceExample}</code></pre>
          </div>
        </section>

        <section className="slider-study" id="slider">
          <div className="slider-heading">
            <div>
              <p className="kicker">APPLE COMPONENT STUDY · 002</p>
              <h2>Slider, translated<br />for the web.</h2>
            </div>
            <p>A native range input with a live glass tracker. Press, click, or drag—the semantic value and custom material stay synchronized.</p>
          </div>
          <div className="slider-stage">
            <div className="slider-orb slider-orb-one" />
            <div className="slider-orb slider-orb-two" />
            <div className="slider-panel">
              <div className="slider-control-row">
                <div><span>Volume</span><strong>{volume}</strong></div>
                <LiquidSlider value={[volume]} onValueChange={([next]) => setVolume(next)} aria-label="Volume" />
              </div>
              <div className="slider-divider" />
              <div className="slider-control-row">
                <div><span>Brightness</span><strong>{brightness}</strong></div>
                <LiquidSlider value={[brightness]} onValueChange={([next]) => setBrightness(next)} tint="#ff9f0a" aria-label="Brightness" />
              </div>
            </div>
          </div>
          <div className="slider-variants">
            <div><span>Small</span><LiquidSlider size="small" defaultValue={[30]} aria-label="Small slider" /></div>
            <div><span>Regular</span><LiquidSlider defaultValue={[55]} aria-label="Regular slider" /></div>
            <div><span>Large</span><LiquidSlider size="large" defaultValue={[76]} tint="#af52de" aria-label="Large slider" /></div>
          </div>
        </section>

        <section className="next">
          <p className="kicker">NEXT COMPONENT</p>
          <div><span>003</span><h2>Tabs</h2><em>Up next</em></div>
        </section>
      </main>

      <footer><span>liquid.ui</span><p>An independent web study. Not affiliated with Apple.</p><span>2026</span></footer>
    </div>
  );
}

export default App;
