"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  liquidLensPresets,
  renderLiquidLensMap,
  resolveLiquidLensOptions,
  type LiquidLensOptions,
} from "./use-liquid-displacement";

const MAX_LENSES = 8;

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Each control is a lens with its own map, packed into one atlas texture. The
// map channels match the DOM renderer: R/G offset, B lighting, A silhouette.
const fragmentShaderSource = `
  precision mediump float;

  varying vec2 v_uv;
  uniform sampler2D u_video;
  uniform sampler2D u_lensAtlas;
  uniform vec2 u_resolution;
  uniform vec2 u_uvScale;
  uniform vec4 u_lenses[${MAX_LENSES}];
  uniform vec4 u_lensAtlasRects[${MAX_LENSES}];
  uniform float u_lensOffsets[${MAX_LENSES}];
  uniform int u_lensCount;
  uniform float u_chroma;

  vec2 coverUv(vec2 uv) {
    return (uv - 0.5) * u_uvScale + 0.5;
  }

  vec3 sampleVideo(vec2 offsetPixels) {
    vec2 offsetUv = vec2(offsetPixels.x, -offsetPixels.y) / u_resolution;
    return texture2D(u_video, coverUv(v_uv + offsetUv)).rgb;
  }

  void main() {
    vec2 screenUv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec4 lensMap = vec4(0.5, 0.5, 0.5, 0.0);
    float lensOffset = 0.0;

    for (int index = 0; index < ${MAX_LENSES}; index++) {
      if (index >= u_lensCount) break;
      vec4 lens = u_lenses[index];
      vec2 local = (screenUv - lens.xy) / lens.zw;
      if (local.x >= 0.0 && local.x <= 1.0 && local.y >= 0.0 && local.y <= 1.0) {
        vec4 atlas = u_lensAtlasRects[index];
        vec4 candidate = texture2D(u_lensAtlas, atlas.xy + local * atlas.zw);
        // Later lenses are nested controls (buttons inside the control bar) and win ties.
        if (candidate.a > 0.0 && candidate.a >= lensMap.a) {
          lensMap = candidate;
          lensOffset = u_lensOffsets[index];
        }
      }
    }

    vec3 base = sampleVideo(vec2(0.0));
    if (lensMap.a <= 0.0) {
      gl_FragColor = vec4(base, 1.0);
      return;
    }

    vec2 offset = (lensMap.rg - 0.5019608) * 2.0 * lensOffset;
    vec3 refracted = vec3(
      sampleVideo(offset * (1.0 + u_chroma)).r,
      sampleVideo(offset).g,
      sampleVideo(offset * (1.0 - u_chroma)).b
    );

    float light = lensMap.b * 2.0 - 1.0;
    refracted *= 1.0 - max(0.0, -light);
    refracted = mix(refracted, vec3(1.0), max(0.0, light));
    gl_FragColor = vec4(mix(base, refracted, lensMap.a), 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function configureTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

type UseVideoRefractionOptions = {
  lens?: LiquidLensOptions;
  lensSelector?: string;
};

type LensEntry = {
  element: HTMLElement;
  key: string;
  width: number;
  height: number;
  radius: number;
  bounds: DOMRect;
};

const quantize = (value: number) => Math.max(2, Math.round(value / 2) * 2);

export function useVideoRefraction({
  lens,
  lensSelector = '[data-liquid-video-lens], [data-slot="liquid-slider-thumb"]',
}: UseVideoRefractionOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const options = useMemo(
    () => resolveLiquidLensOptions({ ...liquidLensPresets.video, ...lens }),
    [
      lens?.blur,
      lens?.borderRadius,
      lens?.chroma,
      lens?.curvature,
      lens?.depth,
      lens?.edgeHighlight,
      lens?.glow,
      lens?.scale,
      lens?.shadow,
      lens?.specularAngle,
      lens?.splay,
    ],
  );

  const invalidate = useCallback(() => drawRef.current?.(), []);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!container || !video || !canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;
    const program = createProgram(gl);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    const videoTexture = gl.createTexture();
    const atlasTexture = gl.createTexture();
    if (!positionBuffer || !videoTexture || !atlasTexture) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    configureTexture(gl, videoTexture);
    configureTexture(gl, atlasTexture);

    let stopped = false;
    let animationFrame = 0;
    let videoFrame = 0;
    let frameScheduled = false;
    let atlasLayout = "";
    let atlasRects = new Map<string, [number, number, number, number]>();
    const mapCache = new Map<string, ImageData>();

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const videoUniform = uniform("u_video");
    const atlasUniform = uniform("u_lensAtlas");
    const resolutionUniform = uniform("u_resolution");
    const uvScaleUniform = uniform("u_uvScale");
    const lensesUniform = uniform("u_lenses[0]");
    const atlasRectsUniform = uniform("u_lensAtlasRects[0]");
    const offsetsUniform = uniform("u_lensOffsets[0]");
    const lensCountUniform = uniform("u_lensCount");
    const chromaUniform = uniform("u_chroma");

    // Packs each distinct lens size into one atlas texture. Maps are only
    // regenerated when a control changes shape, never when it moves.
    const updateAtlas = (entries: LensEntry[], pixelRatio: number) => {
      const unique = [...new Map(entries.map((entry) => [entry.key, entry])).values()];
      const layout = unique.map((entry) => entry.key).join(";");
      if (layout === atlasLayout) return;
      const images = unique.map((entry) => {
        let image = mapCache.get(entry.key);
        if (!image) {
          image = renderLiquidLensMap(
            entry.width,
            entry.height,
            { ...options, borderRadius: entry.radius },
            pixelRatio,
          );
          mapCache.set(entry.key, image);
        }
        return image;
      });
      const atlasWidth = Math.max(1, ...images.map((image) => image.width));
      const atlasHeight = Math.max(1, images.reduce((sum, image) => sum + image.height + 2, 0));
      const pixels = new Uint8Array(atlasWidth * atlasHeight * 4);
      atlasRects = new Map();
      let row = 0;
      unique.forEach((entry, index) => {
        const image = images[index]!;
        for (let y = 0; y < image.height; y += 1) {
          const sourceStart = y * image.width * 4;
          pixels.set(
            image.data.subarray(sourceStart, sourceStart + image.width * 4),
            ((row + y) * atlasWidth) * 4,
          );
        }
        atlasRects.set(entry.key, [
          0.5 / atlasWidth,
          (row + 0.5) / atlasHeight,
          (image.width - 1) / atlasWidth,
          (image.height - 1) / atlasHeight,
        ]);
        row += image.height + 2;
      });
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlasWidth, atlasHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      atlasLayout = layout;
    };

    const collectLenses = () => {
      const entries: LensEntry[] = [];
      for (const element of container.querySelectorAll<HTMLElement>(lensSelector)) {
        if (entries.length >= MAX_LENSES) break;
        if (
          element.matches('[data-slot="liquid-video-center-play"]') &&
          !container.hasAttribute("data-paused")
        ) continue;
        if (
          element.closest('[data-slot="liquid-video-controls"]') &&
          !container.hasAttribute("data-controls-visible")
        ) continue;
        const bounds = element.getBoundingClientRect();
        if (bounds.width < 2 || bounds.height < 2) continue;
        const width = quantize(bounds.width);
        const height = quantize(bounds.height);
        const computedRadius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius);
        const radius = Math.round(
          Math.min(width, height, Number.isFinite(computedRadius) ? computedRadius * 2 : Infinity) / 2,
        );
        entries.push({ element, key: `${width}x${height}r${radius}`, width, height, radius, bounds });
      }
      return entries;
    };

    const draw = () => {
      if (stopped || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const bounds = container.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(2, Math.round(bounds.width * pixelRatio));
      const height = Math.max(2, Math.round(bounds.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.useProgram(program);

      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      } catch {
        // A cross-origin video without CORS taints WebGL; fall back to the native video.
        setReady(false);
        return;
      }

      const entries = collectLenses();
      updateAtlas(entries, pixelRatio);
      const lenses = new Float32Array(MAX_LENSES * 4);
      const rects = new Float32Array(MAX_LENSES * 4);
      const offsets = new Float32Array(MAX_LENSES);
      entries.forEach((entry, index) => {
        const lensBounds = entry.bounds;
        lenses.set([
          (lensBounds.left - bounds.left) / bounds.width,
          (lensBounds.top - bounds.top) / bounds.height,
          lensBounds.width / bounds.width,
          lensBounds.height / bounds.height,
        ], index * 4);
        rects.set(atlasRects.get(entry.key) ?? [0, 0, 0, 0], index * 4);
        offsets[index] = Math.min(lensBounds.width, lensBounds.height) * options.scale * pixelRatio;
      });

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
      gl.uniform1i(videoUniform, 0);
      gl.uniform1i(atlasUniform, 1);
      gl.uniform2f(resolutionUniform, width, height);
      const videoAspect = video.videoWidth / Math.max(1, video.videoHeight);
      const canvasAspect = width / height;
      if (videoAspect > canvasAspect) {
        gl.uniform2f(uvScaleUniform, canvasAspect / videoAspect, 1);
      } else {
        gl.uniform2f(uvScaleUniform, 1, videoAspect / canvasAspect);
      }
      gl.uniform4fv(lensesUniform, lenses);
      gl.uniform4fv(atlasRectsUniform, rects);
      gl.uniform1fv(offsetsUniform, offsets);
      gl.uniform1i(lensCountUniform, entries.length);
      gl.uniform1f(chromaUniform, options.chroma * 0.25);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      setReady(true);
    };
    drawRef.current = draw;

    const schedule = () => {
      if (stopped || frameScheduled || video.paused || video.ended) return;
      frameScheduled = true;
      const frameVideo = video as HTMLVideoElement & {
        requestVideoFrameCallback?: (callback: () => void) => number;
      };
      if (frameVideo.requestVideoFrameCallback) {
        videoFrame = frameVideo.requestVideoFrameCallback(() => {
          frameScheduled = false;
          draw();
          schedule();
        });
      } else {
        animationFrame = window.requestAnimationFrame(() => {
          frameScheduled = false;
          draw();
          schedule();
        });
      }
    };
    const start = () => {
      draw();
      schedule();
    };
    const renderOnce = () => draw();
    // While paused, the canvas only redraws on demand. CSS transitions on the
    // controls (sliding in, buttons growing while pressed, the scrubber thumb
    // engaging) move or reshape lenses, so keep drawing until they settle.
    let settleUntil = 0;
    let settleFrame = 0;
    const settle = (time: number) => {
      settleFrame = 0;
      if (stopped) return;
      if (video.paused || video.ended) draw();
      if (time < settleUntil) settleFrame = window.requestAnimationFrame(settle);
    };
    const keepDrawing = () => {
      settleUntil = performance.now() + 750;
      if (!settleFrame) settleFrame = window.requestAnimationFrame(settle);
    };
    container.addEventListener("transitionrun", keepDrawing);
    container.addEventListener("pointerdown", keepDrawing);
    container.addEventListener("pointerup", keepDrawing);
    video.addEventListener("play", start);
    video.addEventListener("loadeddata", start);
    video.addEventListener("seeked", renderOnce);
    video.addEventListener("pause", renderOnce);
    const resizeObserver = new ResizeObserver(renderOnce);
    resizeObserver.observe(container);
    start();

    return () => {
      stopped = true;
      drawRef.current = null;
      video.removeEventListener("play", start);
      video.removeEventListener("loadeddata", start);
      video.removeEventListener("seeked", renderOnce);
      video.removeEventListener("pause", renderOnce);
      resizeObserver.disconnect();
      container.removeEventListener("transitionrun", keepDrawing);
      container.removeEventListener("pointerdown", keepDrawing);
      container.removeEventListener("pointerup", keepDrawing);
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(settleFrame);
      const frameVideo = video as HTMLVideoElement & {
        cancelVideoFrameCallback?: (handle: number) => void;
      };
      frameVideo.cancelVideoFrameCallback?.(videoFrame);
      gl.deleteTexture(videoTexture);
      gl.deleteTexture(atlasTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, [lensSelector, options]);

  return { containerRef, videoRef, canvasRef, ready, invalidate };
}
