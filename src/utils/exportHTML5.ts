import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ExportConfig, LayerData } from '@/types/index';
import { capitalizeFontName } from './fontUtils';

// Pure-JS easing implementations matching GSAP's easing names.
// Embedded into the exported ad script so no runtime dependencies are needed.
const EASING_FUNCTIONS_JS = `
  function bounceOut(t) {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) { const p = t - 1.5 / d1; return n1 * p * p + 0.75; }
    if (t < 2.5 / d1) { const p = t - 2.25 / d1; return n1 * p * p + 0.9375; }
    const p = t - 2.625 / d1; return n1 * p * p + 0.984375;
  }

  function applyEasing(progress, easing) {
    const t = Math.max(0, Math.min(1, progress));
    if (!easing || easing === 'none' || easing === 'linear') return t;
    if (easing === 'power1.in') return t * t;
    if (easing === 'power1.out') { const r = 1 - t; return 1 - r * r; }
    if (easing === 'power1.inOut') return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    if (easing === 'power2.in') return t * t * t;
    if (easing === 'power2.out') { const r = 1 - t; return 1 - r * r * r; }
    if (easing === 'power2.inOut') return t < 0.5 ? 4 * t * t * t : 1 - 4 * (1 - t) * (1 - t) * (1 - t);
    if (easing === 'power3.in') return t * t * t * t;
    if (easing === 'power3.out') { const r = 1 - t; return 1 - r * r * r * r; }
    if (easing === 'power3.inOut') return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (1 - t) * (1 - t) * (1 - t) * (1 - t);
    if (easing === 'power4.in') return t * t * t * t * t;
    if (easing === 'power4.out') { const r = 1 - t; return 1 - r * r * r * r * r; }
    if (easing === 'power4.inOut') return t < 0.5 ? 16 * t * t * t * t * t : 1 - 16 * (1 - t) * (1 - t) * (1 - t) * (1 - t) * (1 - t);
    if (easing === 'sine.in') return 1 - Math.cos(t * Math.PI / 2);
    if (easing === 'sine.out') return Math.sin(t * Math.PI / 2);
    if (easing === 'sine.inOut') return -(Math.cos(Math.PI * t) - 1) / 2;
    if (easing === 'expo.in') return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
    if (easing === 'expo.out') return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    if (easing === 'expo.inOut') {
      if (t === 0 || t === 1) return t;
      return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
    }
    if (easing === 'circ.in') return 1 - Math.sqrt(1 - t * t);
    if (easing === 'circ.out') return Math.sqrt(1 - (t - 1) * (t - 1));
    if (easing === 'circ.inOut') {
      return t < 0.5
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
        : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
    }
    const c1 = 1.70158, c3 = c1 + 1;
    if (easing === 'back.in') return c3 * t * t * t - c1 * t * t;
    if (easing === 'back.out') { const tp = t - 1; return 1 + c3 * tp * tp * tp + c1 * tp * tp; }
    if (easing === 'back.inOut') {
      const c2 = c1 * 1.525;
      return t < 0.5
        ? (4 * t * t * ((c2 + 1) * 2 * t - c2)) / 2
        : ((2 * t - 2) * (2 * t - 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
    if (easing === 'elastic.in') {
      if (t === 0 || t === 1) return t;
      return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3));
    }
    if (easing === 'elastic.out') {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    }
    if (easing === 'elastic.inOut') {
      if (t === 0 || t === 1) return t;
      return t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2 + 1;
    }
    if (easing === 'bounce.out') return bounceOut(t);
    if (easing === 'bounce.in') return 1 - bounceOut(1 - t);
    if (easing === 'bounce.inOut') return t < 0.5 ? (1 - bounceOut(1 - 2 * t)) / 2 : (1 + bounceOut(2 * t - 1)) / 2;
    return t;
  }
`;

// Generate the script content for the animation
const generateScriptContent = (config: ExportConfig, previewMode = false): string => {
  const { layers, animations, fps, totalFrames } = config;
  const target = config.target ?? 'generic';
  const durationLimit = DURATION_LIMITS_S[target];
  const animDurationS = totalFrames / fps;
  // Calculate how many full loops fit within the platform's duration limit.
  // If no limit applies (e.g. preview mode) or the animation is zero-length, loop forever.
  const maxLoops = (durationLimit && animDurationS > 0)
    ? Math.max(1, Math.floor(durationLimit / animDurationS))
    : 0; // 0 = unlimited

  const helperFunctions = `
    ${EASING_FUNCTIONS_JS}

    function guessExtension(url) {
      if (!url) return 'png';
      const match = url.match(/\\.(png|jpg|jpeg|gif|webp|svg)(?:[?#]|$)/i);
      return match ? match[1].toLowerCase() : 'png';
    }

    function findKeyframeSegment(frame, keyframes) {
      if (keyframes.length === 0) return { prevKeyframe: null, nextKeyframe: null };
      if (keyframes.length === 1) return { prevKeyframe: keyframes[0], nextKeyframe: keyframes[0] };
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (frame >= keyframes[i].frame && frame <= keyframes[i + 1].frame) {
          return { prevKeyframe: keyframes[i], nextKeyframe: keyframes[i + 1] };
        }
      }
      if (frame < keyframes[0].frame) return { prevKeyframe: keyframes[0], nextKeyframe: keyframes[0] };
      return { prevKeyframe: keyframes[keyframes.length - 1], nextKeyframe: keyframes[keyframes.length - 1] };
    }

    function interpolateValue(startVal, endVal, progress, defaultValue) {
      const t = Math.max(0, Math.min(1, progress));
      if (typeof startVal === 'number' && typeof endVal === 'number') {
        return startVal + (endVal - startVal) * t;
      }
      return defaultValue;
    }

    function calculateInterpolatedProps(layer, animation, currentFrame, totalFrames, baseLayerProps, loopCount) {
      if (!animation || animation.keyframes.length === 0) return { ...baseLayerProps };

      const keyframes = animation.keyframes;
      const firstKf = keyframes[0];
      const lastKf = keyframes[keyframes.length - 1];

      // Non-looping layers should stay at their final keyframe on subsequent loops
      if (!animation.loop && loopCount > 0) {
        return { ...baseLayerProps,
          x: lastKf.x ?? baseLayerProps.x,
          y: lastKf.y ?? baseLayerProps.y,
          opacity: lastKf.opacity ?? baseLayerProps.opacity ?? 1,
          width: lastKf.width ?? baseLayerProps.width,
          height: lastKf.height ?? baseLayerProps.height,
          rotation: lastKf.rotation ?? baseLayerProps.rotation ?? 0,
          scaleX: lastKf.scaleX ?? baseLayerProps.scaleX ?? 1,
          scaleY: lastKf.scaleY ?? baseLayerProps.scaleY ?? 1,
        };
      }

      let propsToInterpolate;

      if (animation.loop && animation.loopStartFrame !== undefined && animation.loopEndFrame !== undefined) {
        var loopStart = animation.loopStartFrame;
        var loopEnd = animation.loopEndFrame;
        var loopDuration = loopEnd - loopStart;
        var effectiveFrame;
        if (currentFrame < loopStart) {
          effectiveFrame = currentFrame;
        } else if (loopDuration > 0) {
          effectiveFrame = loopStart + ((currentFrame - loopStart) % loopDuration);
        } else {
          effectiveFrame = loopStart;
        }
        var seg = findKeyframeSegment(effectiveFrame, keyframes);
        var prevKeyframe = seg.prevKeyframe, nextKeyframe = seg.nextKeyframe;
        var frameDiff = nextKeyframe.frame - prevKeyframe.frame;
        var rawProgress = frameDiff > 0 ? (effectiveFrame - prevKeyframe.frame) / frameDiff : (effectiveFrame >= nextKeyframe.frame ? 1 : 0);
        var easedProgress = applyEasing(rawProgress, prevKeyframe.easing || 'none');
        propsToInterpolate = {
          x: interpolateValue(prevKeyframe.x, nextKeyframe.x, easedProgress, baseLayerProps.x),
          y: interpolateValue(prevKeyframe.y, nextKeyframe.y, easedProgress, baseLayerProps.y),
          opacity: interpolateValue(prevKeyframe.opacity, nextKeyframe.opacity, easedProgress, baseLayerProps.opacity != null ? baseLayerProps.opacity : 1),
          width: interpolateValue(prevKeyframe.width, nextKeyframe.width, easedProgress, baseLayerProps.width),
          height: interpolateValue(prevKeyframe.height, nextKeyframe.height, easedProgress, baseLayerProps.height),
          rotation: interpolateValue(prevKeyframe.rotation, nextKeyframe.rotation, easedProgress, baseLayerProps.rotation != null ? baseLayerProps.rotation : 0),
          scaleX: interpolateValue(prevKeyframe.scaleX, nextKeyframe.scaleX, easedProgress, baseLayerProps.scaleX != null ? baseLayerProps.scaleX : 1),
          scaleY: interpolateValue(prevKeyframe.scaleY, nextKeyframe.scaleY, easedProgress, baseLayerProps.scaleY != null ? baseLayerProps.scaleY : 1),
        };
      } else if (animation.loop && currentFrame > lastKf.frame) {
        const loopDuration = totalFrames - 1 - lastKf.frame;
        let loopProgress = 0;
        if (loopDuration <= 0) {
          loopProgress = 1;
        } else {
          loopProgress = Math.max(0, Math.min(1, (currentFrame - lastKf.frame) / loopDuration));
        }
        propsToInterpolate = {
          x: interpolateValue(lastKf.x, firstKf.x, loopProgress, baseLayerProps.x),
          y: interpolateValue(lastKf.y, firstKf.y, loopProgress, baseLayerProps.y),
          opacity: interpolateValue(lastKf.opacity, firstKf.opacity, loopProgress, baseLayerProps.opacity ?? 1),
          width: interpolateValue(lastKf.width, firstKf.width, loopProgress, baseLayerProps.width),
          height: interpolateValue(lastKf.height, firstKf.height, loopProgress, baseLayerProps.height),
          rotation: interpolateValue(lastKf.rotation, firstKf.rotation, loopProgress, baseLayerProps.rotation ?? 0),
          scaleX: interpolateValue(lastKf.scaleX, firstKf.scaleX, loopProgress, baseLayerProps.scaleX ?? 1),
          scaleY: interpolateValue(lastKf.scaleY, firstKf.scaleY, loopProgress, baseLayerProps.scaleY ?? 1),
        };
      } else if (keyframes.length === 1) {
        const kf = keyframes[0];
        propsToInterpolate = {
          x: kf.x ?? baseLayerProps.x,
          y: kf.y ?? baseLayerProps.y,
          opacity: kf.opacity ?? baseLayerProps.opacity ?? 1,
          width: kf.width ?? baseLayerProps.width,
          height: kf.height ?? baseLayerProps.height,
          rotation: kf.rotation ?? baseLayerProps.rotation ?? 0,
          scaleX: kf.scaleX ?? baseLayerProps.scaleX ?? 1,
          scaleY: kf.scaleY ?? baseLayerProps.scaleY ?? 1,
        };
      } else {
        const effectiveFrame2 = Math.max(firstKf.frame, Math.min(lastKf.frame, currentFrame));
        const { prevKeyframe, nextKeyframe } = findKeyframeSegment(effectiveFrame2, keyframes);
        const frameDiff = nextKeyframe.frame - prevKeyframe.frame;
        let rawProgress = frameDiff > 0
          ? (effectiveFrame2 - prevKeyframe.frame) / frameDiff
          : (effectiveFrame2 >= nextKeyframe.frame ? 1 : 0);
        const easedProgress = applyEasing(rawProgress, prevKeyframe.easing || 'none');

        propsToInterpolate = {
          x: interpolateValue(prevKeyframe.x, nextKeyframe.x, easedProgress, baseLayerProps.x),
          y: interpolateValue(prevKeyframe.y, nextKeyframe.y, easedProgress, baseLayerProps.y),
          opacity: interpolateValue(prevKeyframe.opacity, nextKeyframe.opacity, easedProgress, baseLayerProps.opacity ?? 1),
          width: interpolateValue(prevKeyframe.width, nextKeyframe.width, easedProgress, baseLayerProps.width),
          height: interpolateValue(prevKeyframe.height, nextKeyframe.height, easedProgress, baseLayerProps.height),
          rotation: interpolateValue(prevKeyframe.rotation, nextKeyframe.rotation, easedProgress, baseLayerProps.rotation ?? 0),
          scaleX: interpolateValue(prevKeyframe.scaleX, nextKeyframe.scaleX, easedProgress, baseLayerProps.scaleX ?? 1),
          scaleY: interpolateValue(prevKeyframe.scaleY, nextKeyframe.scaleY, easedProgress, baseLayerProps.scaleY ?? 1),
        };
      }

      return { ...baseLayerProps, ...propsToInterpolate };
    }

    function drawImageFitted(ctx, img, drawX, drawY, dw, dh, fit) {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      if (!iw || !ih || fit === 'fill') {
        ctx.drawImage(img, drawX, drawY, dw, dh);
        return;
      }
      if (fit === 'none') {
        ctx.drawImage(img, drawX + (dw - iw) / 2, drawY + (dh - ih) / 2, iw, ih);
        return;
      }
      const scaleX = dw / iw, scaleY = dh / ih;
      const scale = fit === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
      const sw = iw * scale, sh = ih * scale;
      const sx = drawX + (dw - sw) / 2, sy = drawY + (dh - sh) / 2;
      if (fit === 'cover') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(drawX, drawY, dw, dh);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh);
        ctx.restore();
      } else {
        ctx.drawImage(img, sx, sy, sw, sh);
      }
    }
  `;

  return `
    ${helperFunctions}

    const canvas = document.getElementById('adCanvas');
    const ctx = canvas.getContext('2d');
    const layersData = ${JSON.stringify(layers, null, 2)};
    const animationsData = ${JSON.stringify(animations, null, 2)};
    const fps = ${fps};
    const totalFrames = ${totalFrames};
    const maxLoops = ${maxLoops};
    const frameDurationMs = 1000 / fps;
    let startTime = null;
    let currentFrame = 0;
    let loopCount = 0;
    let animationFrameRequestId = null;

    const imageCache = {};
    let imagesLoaded = 0;
    let totalImages = 0;
    const animationMap = new Map(animationsData.map(a => [a.layerId, a]));

    function preloadImages(callback) {
      const imageLayers = layersData.filter(l => l.type === 'image' && l.src);
      totalImages = imageLayers.length;
      imagesLoaded = 0;
      if (totalImages === 0) { callback(); return; }

      imageLayers.forEach(layer => {
        ${previewMode
          ? `const imgSrc = layer.src;`
          : `const extension = guessExtension(layer.src);
        const imgSrc = \`assets/\${layer.id}.\${extension}\`;`
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        imageCache[imgSrc] = img;
        img.onload = () => { if (++imagesLoaded === totalImages) callback(); };
        img.onerror = () => {
          console.error('Failed to load image:', imgSrc);
          if (++imagesLoaded === totalImages) callback();
        };
        img.src = imgSrc;
      });
    }

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const targetFrame = Math.floor((timestamp - startTime) / frameDurationMs);
      const frameChanged = targetFrame !== currentFrame;
      currentFrame = targetFrame;

      const loopingAnims = animationsData.filter(a => a.loop);
      const allHaveExplicitWindows = loopingAnims.length > 0 && loopingAnims.every(
        a => a.loopStartFrame !== undefined && a.loopEndFrame !== undefined
      );

      if (currentFrame >= totalFrames) {
        if (loopingAnims.length === 0) {
          currentFrame = totalFrames - 1;
          drawFrame();
          return;
        }
        loopCount++;
        if (maxLoops > 0 && loopCount >= maxLoops) {
          currentFrame = totalFrames - 1;
          drawFrame();
          return;
        }
        if (allHaveExplicitWindows) {
          const restartFrame = Math.min(...loopingAnims.map(a => a.loopStartFrame));
          startTime = timestamp - (restartFrame * frameDurationMs);
          currentFrame = restartFrame;
        } else {
          startTime = timestamp;
          currentFrame = 0;
        }
      }

      if (frameChanged || currentFrame === 0) drawFrame();
      animationFrameRequestId = requestAnimationFrame(animate);
    }

    function wrapText(text, maxWidth) {
      const lines = [];
      const paragraphs = text.split('\\n');
      for (const para of paragraphs) {
        if (!para) { lines.push(''); continue; }
        const words = para.split(' ');
        let line = '';
        for (const word of words) {
          const testLine = line ? line + ' ' + word : word;
          if (!line || ctx.measureText(testLine).width <= maxWidth) {
            line = testLine;
          } else {
            lines.push(line);
            line = word;
          }
        }
        if (line) lines.push(line);
      }
      return lines.length ? lines : [''];
    }

    function drawLayersRecursive(layers, inheritedOpacity, loopIdx) {
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (!layer.visible) continue;

        const anim = animationMap.get(layer.id);
        const props = calculateInterpolatedProps(layer, anim, currentFrame, totalFrames, layer, loopIdx);
        const effectiveOpacity = Math.max(0, Math.min(1, (props.opacity ?? 1) * inheritedOpacity));

        if (props.type === 'group') {
          drawLayersRecursive(props.children || [], effectiveOpacity, loopIdx);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = effectiveOpacity;
        const blendMode = props.blendMode;
        ctx.globalCompositeOperation = (blendMode && blendMode !== 'normal') ? blendMode : 'source-over';

        const centerX = props.x + props.width / 2;
        const centerY = props.y + props.height / 2;
        ctx.translate(centerX, centerY);
        if (props.rotation) ctx.rotate((props.rotation * Math.PI) / 180);
        if (props.scaleX !== 1 || props.scaleY !== 1) ctx.scale(props.scaleX ?? 1, props.scaleY ?? 1);

        const drawX = -props.width / 2;
        const drawY = -props.height / 2;

        if (props.type === 'color') {
          ctx.fillStyle = props.fill || '#000';
          ctx.fillRect(drawX, drawY, props.width, props.height);

        } else if (props.type === 'gradient' && props.gradient) {
          const g = props.gradient;
          let grad;
          try {
            if (g.type === 'radial') {
              const cx = drawX + (g.center?.x ?? 0.5) * props.width;
              const cy = drawY + (g.center?.y ?? 0.5) * props.height;
              const r = (g.radius ?? 0.5) * Math.min(props.width, props.height);
              grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(r, 0.001));
            } else {
              const x1 = drawX + (g.start?.x ?? 0) * props.width;
              const y1 = drawY + (g.start?.y ?? 0) * props.height;
              const x2 = drawX + (g.end?.x ?? 1) * props.width;
              const y2 = drawY + (g.end?.y ?? 0) * props.height;
              grad = ctx.createLinearGradient(x1, y1, x2, y2);
            }
            (g.stops || []).forEach(stop => grad.addColorStop(stop.position, stop.color));
            ctx.fillStyle = grad;
          } catch (e) {
            ctx.fillStyle = props.fill || '#ccc';
          }
          ctx.fillRect(drawX, drawY, props.width, props.height);

        } else if (props.type === 'image' && props.src) {
          ${previewMode
            ? `const localSrc = props.src;`
            : `const ext = guessExtension(props.src);
          const localSrc = \`assets/\${props.id}.\${ext}\`;`
          }
          const img = imageCache[localSrc];
          if (img && img.complete && img.naturalWidth > 0) {
            try {
              drawImageFitted(ctx, img, drawX, drawY, props.width, props.height, props.fit || 'fill');
            } catch (e) {
              ctx.fillStyle = '#ff0000';
              ctx.fillRect(drawX, drawY, props.width, props.height);
            }
          } else {
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(drawX, drawY, props.width, props.height);
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '14px sans-serif';
            ctx.fillText('?', 0, 0);
          }

        } else if (props.type === 'text') {
          const font = props.font || {};
          const style = font.style || 'normal';
          const weight = font.weight || 400;
          const size = font.size || 16;
          const family = font.family ? JSON.stringify(font.family) : '"Arial"';
          ctx.font = \`\${style} \${weight} \${size}px \${family}\`;
          ctx.fillStyle = props.fill || '#000';
          ctx.textAlign = props.alignment || 'left';
          ctx.textBaseline = 'alphabetic';
          if (font.letterSpacing) ctx.letterSpacing = \`\${font.letterSpacing}px\`;

          let textX = drawX;
          if (props.alignment === 'center') textX = 0;
          else if (props.alignment === 'right') textX = props.width / 2;

          const shadow = props.effects?.shadow;
          if (shadow) {
            ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = shadow.blur ?? 4;
            ctx.shadowOffsetX = shadow.offsetX ?? 2;
            ctx.shadowOffsetY = shadow.offsetY ?? 2;
          }
          const stroke = props.effects?.stroke;
          if (stroke) {
            ctx.strokeStyle = stroke.color || '#000';
            ctx.lineWidth = stroke.width ?? 1;
            ctx.lineJoin = 'round';
          }

          const lineH = (font.lineHeight ?? 1.2) * size;
          const lines = wrapText(props.content || '', props.width);
          let lineY = drawY + size;
          for (const line of lines) {
            if (stroke) ctx.strokeText(line, textX, lineY);
            ctx.fillText(line, textX, lineY);
            lineY += lineH;
          }

          if (shadow) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          if (font.letterSpacing) ctx.letterSpacing = '0px';
        }

        ctx.restore();
      }
    }

    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLayersRecursive(layersData, 1, loopCount);
    }

    document.fonts.ready.then(() => {
      preloadImages(() => requestAnimationFrame(animate));
    }).catch(() => {
      preloadImages(() => requestAnimationFrame(animate));
    });
  `;
};

// Per-target file size limits in KB
const SIZE_LIMITS_KB: Record<string, number> = {
  generic: 150,  // IAB standard
  gdn: 150,      // Google Display Network initial-load limit
  dv360: 200,    // DV360/CM360 limit
  ttd: 150,      // Trade Desk (IAB standard)
};

// Max animation duration in seconds per target
const DURATION_LIMITS_S: Record<string, number> = {
  generic: 15,   // IAB: 15s initial play, then loop
  gdn: 30,       // GDN: 30s per loop
  dv360: 30,     // DV360: 30s
  ttd: 30,       // Trade Desk: 30s
};

// Max file count per target (GDN is most restrictive at 40)
const FILE_COUNT_LIMITS: Record<string, number> = {
  generic: Infinity,
  gdn: 40,
  dv360: Infinity,
  ttd: Infinity,
};

interface ValidationWarnings {
  warnings: string[];
}

// Run pre-export compliance checks and return any warnings
function validateAdConfig(config: ExportConfig, layers: LayerData[]): ValidationWarnings {
  const warnings: string[] = [];
  const target = config.target ?? 'generic';

  const loopingAnims = config.animations.filter(a => a.loop);
  const hasGlobalLoop = loopingAnims.some(
    a => a.loopStartFrame === undefined || a.loopEndFrame === undefined
  );
  const explicitWindowAnims = loopingAnims.filter(
    a => a.loopStartFrame !== undefined && a.loopEndFrame !== undefined
  );

  const durationLimit = DURATION_LIMITS_S[target] ?? 30;

  if (loopingAnims.length === 0) {
    // Play-once ad: warn if it runs too long before stopping
    const playDurationS = config.totalFrames / config.fps;
    if (playDurationS > 15) {
      warnings.push(
        `Play-once ad runs for ${playDurationS.toFixed(1)}s. IAB requires ads stop or loop within 15s. ` +
        `Either shorten the timeline or enable looping on at least one layer.`
      );
    }
  } else if (hasGlobalLoop) {
    // Whole-timeline loop: check loop period
    const loopPeriodS = config.totalFrames / config.fps;
    if (loopPeriodS > durationLimit) {
      warnings.push(
        `Loop period ${loopPeriodS.toFixed(1)}s exceeds the ${durationLimit}s ${target.toUpperCase()} ` +
        `per-loop limit. Shorten the timeline or reduce animation duration.`
      );
    } else {
      const loopCount = Math.max(1, Math.floor(durationLimit / loopPeriodS));
      const totalDurationS = loopCount * loopPeriodS;
      warnings.push(
        `Animation will loop ${loopCount} time${loopCount === 1 ? '' : 's'} ` +
        `(${totalDurationS.toFixed(1)}s total) then stop on its final frame ` +
        `to comply with the ${durationLimit}s ${target.toUpperCase()} limit.`
      );
    }
    if (loopPeriodS > 15) {
      warnings.push(
        `IAB initial-play limit is 15s. The ${loopPeriodS.toFixed(1)}s loop period exceeds this — ` +
        `ensure your target network allows longer loops.`
      );
    }
  }

  // Per-layer explicit window duration checks
  for (const anim of explicitWindowAnims) {
    const windowDurationS = (anim.loopEndFrame! - anim.loopStartFrame!) / config.fps;
    if (windowDurationS > durationLimit) {
      warnings.push(
        `A layer loop window is ${windowDurationS.toFixed(1)}s, exceeding the ${durationLimit}s ` +
        `${target.toUpperCase()} limit.`
      );
    }
  }

  // Google Fonts = external request — violates GDN self-contained rule
  const googleFontsUrl = buildGoogleFontsUrl(layers);
  if (googleFontsUrl) {
    if (target === 'gdn') {
      warnings.push(
        `Ad uses Google Fonts (external request). GDN requires fully self-contained ads with ` +
        `no external requests. The ad may be rejected. Use system fonts (Arial, Verdana, Georgia, etc.) instead.`
      );
    } else if (target === 'dv360') {
      warnings.push(
        `Ad uses Google Fonts (external request to fonts.googleapis.com). ` +
        `DV360 restricted environments may block external requests. Consider using system fonts.`
      );
    }
  }

  // File count check (GDN limit: 40)
  const imageLayers = layers.filter(
    (l): l is LayerData & { type: 'image'; src: string } =>
      l.type === 'image' && typeof (l as LayerData & { src?: string }).src === 'string'
  );
  const totalFiles = 3 + imageLayers.length; // index.html + script.js + styles.css + images
  const fileLimit = FILE_COUNT_LIMITS[target] ?? Infinity;
  if (totalFiles > fileLimit) {
    warnings.push(
      `Package contains ~${totalFiles} files which exceeds the ${target.toUpperCase()} ` +
      `${fileLimit}-file limit. Reduce the number of image assets.`
    );
  }

  return { warnings };
}

// Helper function to build Google Fonts URL
const buildGoogleFontsUrl = (layers: LayerData[]): string | null => {
  const fontMap = new Map<string, Set<string>>();
  const systemFonts = new Set([
    'Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia',
    'Garamond', 'Courier New', 'Brush Script MT', 'Helvetica', 'sans-serif', 'serif', 'monospace'
  ]);

  layers.forEach(layer => {
    if (layer.type === 'text' && layer.font?.family) {
      const family = capitalizeFontName(layer.font.family);
      if (systemFonts.has(family)) return;

      const weight = layer.font.weight || 400;
      const style = layer.font.style || 'normal';
      const variant = `${style === 'italic' ? '1' : '0'},${weight}`;

      if (!fontMap.has(family)) fontMap.set(family, new Set());
      fontMap.get(family)!.add(variant);
    }
  });

  if (fontMap.size === 0) return null;

  const families = Array.from(fontMap.entries())
    .map(([family, variants]) => {
      const sorted = Array.from(variants).sort();
      return `family=${family}:ital,wght@${sorted.join(';')}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
};

// Generate the HTML content
const generateHTMLContent = (config: ExportConfig, layers: LayerData[]): string => {
  const { stageSize, target = 'generic' } = config;
  const googleFontsUrl = buildGoogleFontsUrl(layers);

  const dv360Head = target === 'dv360' ? `
  <script src="https://s0.2mdn.net/ads/studio/Enabler.js"></script>
  <script>
    Enabler.setProfileId(0);
    var initialized=false;
    function init(){if(initialized)return;initialized=true;startAd();}
    if(Enabler.isInitialized()){init();}else{Enabler.addEventListener(studio.events.StudioEvent.INIT,init);}
  </script>` : '';

  // clickTag conventions per network:
  // DV360: use Enabler.getUrl() — populated by the platform at serve time
  // Trade Desk: uses "clickTAG" (capital TAG) — must be empty string in creative
  // GDN / Generic: standard "clickTag" — empty string, populated by platform at serve time
  const clickTagScript = target === 'dv360'
    ? `<script>var clickTag = Enabler.getUrl("CLICK_TAG_URL") || "";</script>`
    : target === 'ttd'
    ? `<script>var clickTAG = "";</script>`
    : `<script>var clickTag = "";</script>`;

  // Canvas click uses the correct variable name for the target platform
  const clickTagVar = target === 'ttd' ? 'clickTAG' : 'clickTag';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="ad.size" content="width=${stageSize.width},height=${stageSize.height}">
  ${googleFontsUrl ? `<link href="${googleFontsUrl}" rel="stylesheet">` : ''}
  <title>HTML5 Ad</title>
  <link rel="stylesheet" href="styles.css">${dv360Head}
  ${clickTagScript}
</head>
<body>
  <canvas id="adCanvas" width="${stageSize.width}" height="${stageSize.height}" onclick="window.open(${clickTagVar})" style="cursor:pointer"></canvas>
  <script src="script.js"></script>
</body>
</html>`;
};

// Generate the CSS content
const generateCSSContent = (): string => `body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#adCanvas {
  display: block;
}`;

// Helper to guess file extension from URL or blob MIME type
const guessExtension = (url: string | undefined): string => {
  if (!url) return 'png';
  const match = url.match(/\.(png|jpg|jpeg|gif|webp|svg)(?:[?#]|$)/i);
  return match ? match[1].toLowerCase() : 'png';
};

// Generate a self-contained HTML preview (script + CSS inlined, images loaded from original src)
export const generatePreviewHTML = (config: ExportConfig): string => {
  const { stageSize } = config;
  const googleFontsUrl = buildGoogleFontsUrl(config.layers);
  const script = generateScriptContent(config, true);
  const css = generateCSSContent();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${googleFontsUrl ? `<link href="${googleFontsUrl}" rel="stylesheet">` : ''}
  <style>${css}</style>
</head>
<body>
  <canvas id="adCanvas" width="${stageSize.width}" height="${stageSize.height}"></canvas>
  <script>(function(){${script}})()</script>
</body>
</html>`;
};

// Shared logic: populate a JSZip folder with the ad package contents
async function buildAdZipFolder(
  folder: JSZip,
  config: ExportConfig,
  log?: (msg: string) => void,
  warn?: (msg: string) => void
): Promise<void> {
  // Run compliance checks before building
  const { warnings } = validateAdConfig(config, config.layers);
  warnings.forEach(w => warn?.(w));

  log?.('Generating script.js...');
  folder.file('script.js', generateScriptContent(config));

  log?.('Generating styles.css...');
  folder.file('styles.css', generateCSSContent());

  log?.('Generating index.html...');
  folder.file('index.html', generateHTMLContent(config, config.layers));

  const assetsFolder = folder.folder('assets');
  if (!assetsFolder) throw new Error('Failed to create assets folder in zip.');

  const imageLayers = config.layers.filter(
    (layer): layer is LayerData & { type: 'image'; src: string } =>
      layer.type === 'image' && typeof layer.src === 'string' && layer.src.length > 0
  );

  log?.(`Processing ${imageLayers.length} image asset(s)...`);

  const results = await Promise.allSettled(
    imageLayers.map(async (layer) => {
      const { src, id } = layer;
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${src}`);
        const blob = await response.blob();

        let extension = guessExtension(src);
        if (blob.type.startsWith('image/')) {
          const mimeExt = blob.type.split('/')[1].split('+')[0];
          if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(mimeExt)) {
            extension = mimeExt;
          }
        }

        const filename = `${id}.${extension}`;
        assetsFolder.file(filename, blob);
        log?.(`  Added ${filename} (${(blob.size / 1024).toFixed(1)} KB)`);
        return { success: true };
      } catch (error) {
        warn?.(`Failed to fetch asset for layer ${id}: ${error instanceof Error ? error.message : error}`);
        return { success: false };
      }
    })
  );

  const failed = results.filter(
    r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  ).length;
  if (failed > 0) warn?.(`${failed} asset(s) failed to bundle. Package may be incomplete.`);

  log?.('Asset processing complete.');
}

// Returns a blob of the ad package zip (used for multi-scene batch exports)
export const generateScenePackageBlob = async (
  config: ExportConfig,
  log?: (message: string) => void,
  warn?: (warning: string) => void
): Promise<Blob> => {
  const zip = new JSZip();
  await buildAdZipFolder(zip, config, log, warn);

  log?.('Creating zip blob...');
  const blob = await zip.generateAsync({ type: 'blob' });

  const sizeKB = blob.size / 1024;
  const target = config.target ?? 'generic';
  const sizeLimit = SIZE_LIMITS_KB[target] ?? 150;
  if (sizeKB > sizeLimit) {
    warn?.(`Package size ${sizeKB.toFixed(1)} KB exceeds the ${sizeLimit} KB ${target.toUpperCase()} limit.`);
  }

  return blob;
};

// Main export function — generates and downloads an ad_package.zip
export const exportHTML5Package = async (
  config: ExportConfig,
  onProgress?: (message: string) => void,
  onWarning?: (warning: string) => void
): Promise<void> => {
  onProgress?.('Creating ZIP package...');
  const zip = new JSZip();
  const adFolder = zip.folder('ad_package');
  if (!adFolder) throw new Error('Failed to create ad_package folder');

  await buildAdZipFolder(adFolder, config, onProgress, onWarning);

  onProgress?.('Generating ZIP file...');
  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  const sizeKB = content.size / 1024;
  const target = config.target ?? 'generic';
  const sizeLimit = SIZE_LIMITS_KB[target] ?? 150;
  if (sizeKB > sizeLimit) {
    onWarning?.(`Export size ${sizeKB.toFixed(1)} KB exceeds the ${sizeLimit} KB ${target.toUpperCase()} limit.`);
  }

  const zipFilename = `${config.filename || 'ad_package'}.zip`;
  saveAs(content, zipFilename);
  onProgress?.('Export complete!');
};
