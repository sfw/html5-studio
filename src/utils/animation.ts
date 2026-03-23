import { LayerData, AnimationData, Keyframe } from '@/types/index';
import gsap from 'gsap';

export const findKeyframeSegment = (
  frame: number,
  keyframes: Keyframe[]
): { prevKeyframe: Keyframe; nextKeyframe: Keyframe } => {
  if (keyframes.length === 0) {
    const defaultKf: Keyframe = { frame: 0, x: 0, y: 0, opacity: 1 };
    return { prevKeyframe: defaultKf, nextKeyframe: defaultKf };
  }
  if (keyframes.length === 1) {
    return { prevKeyframe: keyframes[0], nextKeyframe: keyframes[0] };
  }

  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
      return { prevKeyframe: sorted[i], nextKeyframe: sorted[i + 1] };
    }
  }

  if (frame < sorted[0].frame) {
    return { prevKeyframe: sorted[0], nextKeyframe: sorted[0] };
  }
  return { prevKeyframe: sorted[sorted.length - 1], nextKeyframe: sorted[sorted.length - 1] };
};

export const interpolateValue = (
  startVal: number | undefined,
  endVal: number | undefined,
  progress: number,
  defaultValue: number
): number => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  if (typeof startVal === 'number' && typeof endVal === 'number') {
    return startVal + (endVal - startVal) * clampedProgress;
  }
  return defaultValue;
};

export const calculateLayerProps = (
  layer: LayerData,
  animation: AnimationData | undefined,
  currentFrame: number,
  totalFrames: number
): LayerData => {
  if (!animation || animation.keyframes.length < 2) return layer;

  const sortedKeyframes = [...animation.keyframes].sort((a, b) => a.frame - b.frame);
  const firstKf = sortedKeyframes[0];
  const lastKf = sortedKeyframes[sortedKeyframes.length - 1];

  let propsToInterpolate: Partial<LayerData> = {};

  if (animation.loop && animation.loopStartFrame !== undefined && animation.loopEndFrame !== undefined) {
    const loopStart = animation.loopStartFrame;
    const loopEnd = animation.loopEndFrame;
    const loopDuration = loopEnd - loopStart;

    let effectiveFrame: number;
    if (currentFrame < loopStart) {
      effectiveFrame = currentFrame; // before the loop: play normally
    } else if (loopDuration > 0) {
      effectiveFrame = loopStart + ((currentFrame - loopStart) % loopDuration);
    } else {
      effectiveFrame = loopStart;
    }

    const { prevKeyframe, nextKeyframe } = findKeyframeSegment(effectiveFrame, sortedKeyframes);
    const frameDiff = nextKeyframe.frame - prevKeyframe.frame;
    let progress = 0;
    if (frameDiff > 0) {
      progress = (effectiveFrame - prevKeyframe.frame) / frameDiff;
    } else if (effectiveFrame >= nextKeyframe.frame) {
      progress = 1;
    }
    const easeString = prevKeyframe.easing || 'none';
    const easeFunc = gsap.parseEase(easeString);
    const easedProgress = easeFunc ? easeFunc(progress) : progress;

    propsToInterpolate = {
      x: interpolateValue(prevKeyframe.x, nextKeyframe.x, easedProgress, layer.x),
      y: interpolateValue(prevKeyframe.y, nextKeyframe.y, easedProgress, layer.y),
      opacity: interpolateValue(prevKeyframe.opacity, nextKeyframe.opacity, easedProgress, layer.opacity ?? 1),
      width: interpolateValue(prevKeyframe.width, nextKeyframe.width, easedProgress, layer.width),
      height: interpolateValue(prevKeyframe.height, nextKeyframe.height, easedProgress, layer.height),
      rotation: interpolateValue(prevKeyframe.rotation, nextKeyframe.rotation, easedProgress, layer.rotation ?? 0),
      scaleX: interpolateValue(prevKeyframe.scaleX, nextKeyframe.scaleX, easedProgress, layer.scaleX ?? 1),
      scaleY: interpolateValue(prevKeyframe.scaleY, nextKeyframe.scaleY, easedProgress, layer.scaleY ?? 1),
    };
  } else if (animation.loop && currentFrame > lastKf.frame) {
    const loopReturnDuration = totalFrames - 1 - lastKf.frame;

    if (loopReturnDuration <= 0) {
      propsToInterpolate = {
        x: lastKf.x ?? layer.x,
        y: lastKf.y ?? layer.y,
        opacity: lastKf.opacity ?? layer.opacity ?? 1,
        width: lastKf.width ?? layer.width,
        height: lastKf.height ?? layer.height,
        rotation: lastKf.rotation ?? layer.rotation ?? 0,
        scaleX: lastKf.scaleX ?? layer.scaleX ?? 1,
        scaleY: lastKf.scaleY ?? layer.scaleY ?? 1,
      };
    } else {
      const progressInReturn = (currentFrame - lastKf.frame) / loopReturnDuration;

      propsToInterpolate = {
        x: interpolateValue(lastKf.x, firstKf.x, progressInReturn, layer.x),
        y: interpolateValue(lastKf.y, firstKf.y, progressInReturn, layer.y),
        opacity: interpolateValue(lastKf.opacity, firstKf.opacity, progressInReturn, layer.opacity ?? 1),
        width: interpolateValue(lastKf.width, firstKf.width, progressInReturn, layer.width),
        height: interpolateValue(lastKf.height, firstKf.height, progressInReturn, layer.height),
        rotation: interpolateValue(lastKf.rotation, firstKf.rotation, progressInReturn, layer.rotation ?? 0),
        scaleX: interpolateValue(lastKf.scaleX, firstKf.scaleX, progressInReturn, layer.scaleX ?? 1),
        scaleY: interpolateValue(lastKf.scaleY, firstKf.scaleY, progressInReturn, layer.scaleY ?? 1),
      };
    }
  } else {
    const { prevKeyframe, nextKeyframe } = findKeyframeSegment(currentFrame, sortedKeyframes);
    
    const frameDiff = nextKeyframe.frame - prevKeyframe.frame;
    let progress = 0;
    if (frameDiff > 0) {
      progress = (currentFrame - prevKeyframe.frame) / frameDiff;
    } else if (currentFrame >= nextKeyframe.frame) {
      progress = 1;
    }

    // Get the easing function from the *previous* keyframe
    const easeString = prevKeyframe.easing || 'none'; // Default to 'none' which GSAP treats as linear
    const easeFunc = gsap.parseEase(easeString);
    const easedProgress = easeFunc ? easeFunc(progress) : progress; // Apply easing

    const interpolatedOpacity = interpolateValue(prevKeyframe.opacity, nextKeyframe.opacity, easedProgress, layer.opacity ?? 1); // Use easedProgress

    propsToInterpolate = {
      x: interpolateValue(prevKeyframe.x, nextKeyframe.x, easedProgress, layer.x),
      y: interpolateValue(prevKeyframe.y, nextKeyframe.y, easedProgress, layer.y),
      opacity: interpolatedOpacity,
      width: interpolateValue(prevKeyframe.width, nextKeyframe.width, easedProgress, layer.width),
      height: interpolateValue(prevKeyframe.height, nextKeyframe.height, easedProgress, layer.height),
      rotation: interpolateValue(prevKeyframe.rotation, nextKeyframe.rotation, easedProgress, layer.rotation ?? 0),
      scaleX: interpolateValue(prevKeyframe.scaleX, nextKeyframe.scaleX, easedProgress, layer.scaleX ?? 1),
      scaleY: interpolateValue(prevKeyframe.scaleY, nextKeyframe.scaleY, easedProgress, layer.scaleY ?? 1),
    };
  }

  return {
    ...layer,
    ...propsToInterpolate,
  } as LayerData;
};

export const shouldLoop = (animations: AnimationData[]): boolean => {
  return animations.some(anim => anim.loop);
};

export const getNextFrame = (
  currentFrame: number,
  totalFrames: number,
  animations: AnimationData[]
): { nextFrame: number; shouldStop: boolean } => {
  if (currentFrame >= totalFrames - 1) {
    const loopingAnims = animations.filter(a => a.loop);
    if (loopingAnims.length === 0) {
      return { nextFrame: totalFrames - 1, shouldStop: true };
    }

    // If ALL looping layers have explicit windows, restart at earliest loopStartFrame
    const allHaveExplicitWindows = loopingAnims.every(
      a => a.loopStartFrame !== undefined && a.loopEndFrame !== undefined
    );
    if (allHaveExplicitWindows) {
      const restartFrame = Math.min(...loopingAnims.map(a => a.loopStartFrame!));
      return { nextFrame: restartFrame, shouldStop: false };
    }

    return { nextFrame: 0, shouldStop: false };
  }
  return { nextFrame: currentFrame + 1, shouldStop: false };
}; 