"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  generateLiquidLensMap,
  liquidLensPresets,
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

const fragmentShaderSource = `
  precision mediump float;

  varying vec2 v_uv;
  uniform sampler2D u_video;
  uniform sampler2D u_lensMap;
  uniform vec2 u_resolution;
  uniform vec2 u_uvScale;
  uniform vec4 u_lenses[${MAX_LENSES}];
  uniform int u_lensCount;
  uniform float u_scale;
  uniform float u_chroma;
  uniform float u_glow;
  uniform float u_edgeHighlight;
  uniform float u_specularAngle;

  vec2 coverUv(vec2 uv) {
    return (uv - 0.5) * u_uvScale + 0.5;
  }

  void main() {
    vec2 screenUv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 displacement = vec2(0.0);
    float surface = 0.0;
    float inside = 0.0;

    for (int index = 0; index < ${MAX_LENSES}; index++) {
      if (index >= u_lensCount) break;
      vec4 lens = u_lenses[index];
      vec2 local = (screenUv - lens.xy) / lens.zw;
      if (local.x >= 0.0 && local.x <= 1.0 && local.y >= 0.0 && local.y <= 1.0) {
        vec3 map = texture2D(u_lensMap, vec2(local.x, 1.0 - local.y)).rgb;
        vec2 candidate = (map.rg - 0.5019608) * 2.0;
        float strength = length(candidate);
        if (strength > length(displacement)) {
          displacement = candidate;
          surface = map.b;
          inside = step(0.002, strength + surface);
        }
      }
    }

    vec2 displacedPixels = displacement * u_scale;
    vec2 displacedUv = vec2(displacedPixels.x, -displacedPixels.y) / u_resolution;
    vec2 chromaUv = normalize(displacedUv + vec2(0.000001)) * u_chroma * inside / u_resolution;
    vec2 redUv = coverUv(v_uv + displacedUv + chromaUv);
    vec2 greenUv = coverUv(v_uv + displacedUv);
    vec2 blueUv = coverUv(v_uv + displacedUv - chromaUv);
    vec3 color = vec3(
      texture2D(u_video, redUv).r,
      texture2D(u_video, greenUv).g,
      texture2D(u_video, blueUv).b
    );

    float angle = radians(u_specularAngle);
    vec2 lightDirection = vec2(cos(angle), sin(angle));
    float directional = max(0.0, dot(normalize(displacement + vec2(0.0001)), lightDirection));
    float edge = smoothstep(0.02, 0.72, length(displacement));
    float specular = pow(directional, 10.0) * edge * u_edgeHighlight * inside;
    float glow = (1.0 - surface) * edge * u_glow * inside;
    color += vec3(specular + glow);

    gl_FragColor = vec4(color, 1.0);
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
    () => ({ ...liquidLensPresets.video, ...lens }),
    [
      lens?.blur,
      lens?.borderRadius,
      lens?.chroma,
      lens?.curvature,
      lens?.depth,
      lens?.edgeHighlight,
      lens?.glow,
      lens?.scale,
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
    const mapTexture = gl.createTexture();
    if (!positionBuffer || !videoTexture || !mapTexture) return;
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
    configureTexture(gl, mapTexture);
    const mapImage = new Image();
    let mapReady = false;
    let stopped = false;
    let animationFrame = 0;
    let videoFrame = 0;
    let frameScheduled = false;

    mapImage.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, mapTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapImage);
      mapReady = true;
      drawRef.current?.();
    };
    mapImage.src = generateLiquidLensMap(96, 60, {
      ...options,
      borderRadius: options.borderRadius ?? 28,
    });

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const videoUniform = uniform("u_video");
    const mapUniform = uniform("u_lensMap");
    const resolutionUniform = uniform("u_resolution");
    const uvScaleUniform = uniform("u_uvScale");
    const lensesUniform = uniform("u_lenses[0]");
    const lensCountUniform = uniform("u_lensCount");
    const scaleUniform = uniform("u_scale");
    const chromaUniform = uniform("u_chroma");
    const glowUniform = uniform("u_glow");
    const edgeUniform = uniform("u_edgeHighlight");
    const angleUniform = uniform("u_specularAngle");

    const draw = () => {
      if (stopped || !mapReady || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
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
        setReady(false);
        return;
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mapTexture);
      gl.uniform1i(videoUniform, 0);
      gl.uniform1i(mapUniform, 1);
      gl.uniform2f(resolutionUniform, width, height);

      const videoAspect = video.videoWidth / Math.max(1, video.videoHeight);
      const canvasAspect = width / height;
      if (videoAspect > canvasAspect) {
        gl.uniform2f(uvScaleUniform, canvasAspect / videoAspect, 1);
      } else {
        gl.uniform2f(uvScaleUniform, 1, videoAspect / canvasAspect);
      }

      const lenses = new Float32Array(MAX_LENSES * 4);
      const elements = Array.from(
        container.querySelectorAll<HTMLElement>(lensSelector),
      ).slice(0, MAX_LENSES);
      let count = 0;
      for (const element of elements) {
        if (
          element.matches('[data-slot="liquid-video-center-play"]') &&
          !container.hasAttribute("data-paused")
        ) continue;
        if (
          element.closest('[data-slot="liquid-video-controls"]') &&
          !container.hasAttribute("data-controls-visible")
        ) continue;
        const lensBounds = element.getBoundingClientRect();
        if (lensBounds.width <= 0 || lensBounds.height <= 0) continue;
        const offset = count * 4;
        lenses[offset] = (lensBounds.left - bounds.left) / bounds.width;
        lenses[offset + 1] = (lensBounds.top - bounds.top) / bounds.height;
        lenses[offset + 2] = lensBounds.width / bounds.width;
        lenses[offset + 3] = lensBounds.height / bounds.height;
        count += 1;
      }
      gl.uniform4fv(lensesUniform, lenses);
      gl.uniform1i(lensCountUniform, count);
      gl.uniform1f(scaleUniform, 60 * (options.scale ?? 0.075) * 2 * pixelRatio);
      gl.uniform1f(chromaUniform, (options.chroma ?? 0.45) * 1.5 * pixelRatio);
      gl.uniform1f(glowUniform, options.glow ?? 0.1);
      gl.uniform1f(edgeUniform, options.edgeHighlight ?? 0.25);
      gl.uniform1f(angleUniform, options.specularAngle ?? 45);
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
      window.cancelAnimationFrame(animationFrame);
      const frameVideo = video as HTMLVideoElement & {
        cancelVideoFrameCallback?: (handle: number) => void;
      };
      frameVideo.cancelVideoFrameCallback?.(videoFrame);
      gl.deleteTexture(videoTexture);
      gl.deleteTexture(mapTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, [lensSelector, options]);

  return { containerRef, videoRef, canvasRef, ready, invalidate };
}
