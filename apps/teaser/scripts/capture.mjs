import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";

const width = 1080;
const height = 1080;
const fps = 30;
const frames = 126;
const port = 9223;
const outputDir = new URL("../frames/", import.meta.url);
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profilePath = "/tmp/liquid-switch-teaser-chrome";

await mkdir(outputDir, { recursive: true });

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--hide-scrollbars",
    "--disable-gpu",
    "--disable-features=CalculateNativeWinOcclusion",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    "http://127.0.0.1:4173",
  ],
  { stdio: "ignore" },
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let targets;
for (let attempt = 0; attempt < 80; attempt += 1) {
  try {
    targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
    if (targets.length) break;
  } catch {
    await delay(100);
  }
}

if (!targets?.length) {
  chrome.kill();
  throw new Error("Chrome DevTools target did not start.");
}

const target = targets.find((entry) => entry.type === "page") ?? targets[0];
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const resolver = pending.get(message.id);
  if (!resolver) return;
  pending.delete(message.id);
  if (message.error) resolver.reject(new Error(message.error.message));
  else resolver.resolve(message.result);
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: false,
});

for (let attempt = 0; attempt < 100; attempt += 1) {
  const result = await send("Runtime.evaluate", {
    expression: "Boolean(window.__teaserReady)",
    returnByValue: true,
  });
  if (result.result.value) break;
  await delay(100);
}

for (let frame = 0; frame < frames; frame += 1) {
  await send("Runtime.evaluate", {
    expression: `window.__setTeaserFrame(${frame})`,
    awaitPromise: true,
    returnByValue: true,
  });
  const result = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const name = `frame-${String(frame).padStart(4, "0")}.png`;
  await writeFile(new URL(name, outputDir), Buffer.from(result.data, "base64"));
  if (frame % 30 === 0) process.stdout.write(`Captured ${frame}/${frames}\n`);
}

socket.close();
chrome.kill();
process.stdout.write(`Captured ${frames} frames.\n`);
