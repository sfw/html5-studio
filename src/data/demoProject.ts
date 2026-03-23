import type { ProjectData, AnimationScene, LayerData, AnimationData } from '@/types/index';

// Brand colors
const NAVY = '#0A2240';
const NAVY_MID = '#153A60';
const NAVY_DARK2 = '#1A4878';
const NAVY_CARD = '#0D2D50';
const GOLD = '#C4993B';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#B8D4E8';

// ---------------------------------------------------------------------------
// Scene 1: 300×250 — Medium Rectangle
// ---------------------------------------------------------------------------
const scene1: AnimationScene = {
  id: '300x250-meridian',
  name: '300×250 — Medium Rectangle',
  stageSize: { width: 300, height: 250 },
  totalDuration: 5,
  fps: 60,
  currentFrame: 0,
  isPlaying: false,
  hasUnsavedChanges: false,
  layers: [
    {
      id: 'bg', name: 'bg', type: 'gradient',
      x: 0, y: 0, width: 300, height: 250,
      visible: true, opacity: 1, blendMode: 'normal',
      gradient: {
        type: 'linear',
        stops: [{ color: NAVY, position: 0 }, { color: NAVY_MID, position: 1 }],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
      },
    } as LayerData,
    {
      id: 'top_bar', name: 'top_bar', type: 'color',
      x: 0, y: 0, width: 300, height: 4,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'bot_bar', name: 'bot_bar', type: 'color',
      x: 0, y: 246, width: 300, height: 4,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'logo', name: 'logo', type: 'text',
      x: 20, y: 55, width: 260, height: 28,
      content: 'MERIDIAN BANK',
      font: { family: 'Arial', size: 20, weight: 800, style: 'normal', letterSpacing: 3, lineHeight: 1.2 },
      fill: WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'divider', name: 'divider', type: 'color',
      x: 110, y: 91, width: 80, height: 2,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'tagline', name: 'tagline', type: 'text',
      x: 20, y: 98, width: 260, height: 36,
      content: 'Your Future, Secured.',
      font: { family: 'Arial', size: 13, weight: 400, style: 'italic', letterSpacing: 0.5, lineHeight: 1.5 },
      fill: GOLD, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'offer', name: 'offer', type: 'text',
      x: 20, y: 140, width: 260, height: 18,
      content: '0% Fees · 12 Months · No Minimum',
      font: { family: 'Arial', size: 10, weight: 400, style: 'normal', letterSpacing: 0.5, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_bg', name: 'cta_bg', type: 'color',
      x: 82, y: 168, width: 136, height: 36,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_text', name: 'cta_text', type: 'text',
      x: 82, y: 168, width: 136, height: 36,
      content: 'Open an Account',
      font: { family: 'Arial', size: 11, weight: 700, style: 'normal', letterSpacing: 0.5, lineHeight: 1.2 },
      fill: NAVY, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
  ],
  animations: [
    {
      layerId: 'top_bar', loop: true,
      keyframes: [
        { frame: 0, x: 0, y: 0, width: 0, height: 4, opacity: 1 },
        { frame: 25, x: 0, y: 0, width: 300, height: 4, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 0, y: 0, width: 300, height: 4, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'bot_bar', loop: true,
      keyframes: [
        { frame: 15, x: 300, y: 246, width: 0, height: 4, opacity: 1 },
        { frame: 45, x: 0, y: 246, width: 300, height: 4, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 0, y: 246, width: 300, height: 4, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'logo', loop: true,
      keyframes: [
        { frame: 20, x: 20, y: 68, width: 260, height: 28, opacity: 0 },
        { frame: 65, x: 20, y: 55, width: 260, height: 28, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 20, y: 55, width: 260, height: 28, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'divider', loop: true,
      keyframes: [
        { frame: 55, x: 150, y: 91, width: 0, height: 2, opacity: 1 },
        { frame: 80, x: 110, y: 91, width: 80, height: 2, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 110, y: 91, width: 80, height: 2, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'tagline', loop: true,
      keyframes: [
        { frame: 65, x: 20, y: 98, width: 260, height: 36, opacity: 0 },
        { frame: 100, x: 20, y: 98, width: 260, height: 36, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 20, y: 98, width: 260, height: 36, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'offer', loop: true,
      keyframes: [
        { frame: 85, x: 20, y: 140, width: 260, height: 18, opacity: 0 },
        { frame: 115, x: 20, y: 140, width: 260, height: 18, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 20, y: 140, width: 260, height: 18, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_bg', loop: true,
      keyframes: [
        { frame: 100, x: 82, y: 175, width: 136, height: 36, opacity: 0, scaleX: 0.85, scaleY: 0.85 },
        { frame: 130, x: 82, y: 168, width: 136, height: 36, opacity: 1, scaleX: 1, scaleY: 1, easing: 'back.out' },
        { frame: 270, x: 82, y: 168, width: 136, height: 36, opacity: 1, scaleX: 1, scaleY: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_text', loop: true,
      keyframes: [
        { frame: 115, x: 82, y: 168, width: 136, height: 36, opacity: 0 },
        { frame: 140, x: 82, y: 168, width: 136, height: 36, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 82, y: 168, width: 136, height: 36, opacity: 1 },
      ],
    } as AnimationData,
  ],
};

// ---------------------------------------------------------------------------
// Scene 2: 728×90 — Leaderboard
// ---------------------------------------------------------------------------
const scene2: AnimationScene = {
  id: '728x90-meridian',
  name: '728×90 — Leaderboard',
  stageSize: { width: 728, height: 90 },
  totalDuration: 5,
  fps: 60,
  currentFrame: 0,
  isPlaying: false,
  hasUnsavedChanges: false,
  layers: [
    {
      id: 'bg', name: 'bg', type: 'gradient',
      x: 0, y: 0, width: 728, height: 90,
      visible: true, opacity: 1, blendMode: 'normal',
      gradient: {
        type: 'linear',
        stops: [{ color: NAVY, position: 0 }, { color: NAVY_MID, position: 1 }],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      },
    } as LayerData,
    {
      id: 'left_accent', name: 'left_accent', type: 'color',
      x: 0, y: 0, width: 4, height: 90,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'right_accent', name: 'right_accent', type: 'color',
      x: 724, y: 0, width: 4, height: 90,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'logo', name: 'logo', type: 'text',
      x: 20, y: 25, width: 165, height: 40,
      content: 'MERIDIAN BANK',
      font: { family: 'Arial', size: 16, weight: 800, style: 'normal', letterSpacing: 2, lineHeight: 1.2 },
      fill: WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'divider_v', name: 'divider_v', type: 'color',
      x: 205, y: 15, width: 1, height: 60,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'tagline', name: 'tagline', type: 'text',
      x: 218, y: 30, width: 285, height: 30,
      content: 'Your Future, Secured.',
      font: { family: 'Arial', size: 14, weight: 400, style: 'italic', letterSpacing: 0.5, lineHeight: 1.3 },
      fill: GOLD, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_bg', name: 'cta_bg', type: 'color',
      x: 548, y: 22, width: 160, height: 46,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_text', name: 'cta_text', type: 'text',
      x: 548, y: 22, width: 160, height: 46,
      content: 'Open an Account',
      font: { family: 'Arial', size: 11, weight: 700, style: 'normal', letterSpacing: 0.5, lineHeight: 1.2 },
      fill: NAVY, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
  ],
  animations: [
    {
      layerId: 'logo', loop: true,
      keyframes: [
        { frame: 0, x: -100, y: 25, width: 165, height: 40, opacity: 0 },
        { frame: 45, x: 20, y: 25, width: 165, height: 40, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 20, y: 25, width: 165, height: 40, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'divider_v', loop: true,
      keyframes: [
        { frame: 30, x: 205, y: 45, width: 1, height: 0, opacity: 1 },
        { frame: 60, x: 205, y: 15, width: 1, height: 60, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 205, y: 15, width: 1, height: 60, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'tagline', loop: true,
      keyframes: [
        { frame: 45, x: 240, y: 30, width: 285, height: 30, opacity: 0 },
        { frame: 85, x: 218, y: 30, width: 285, height: 30, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 218, y: 30, width: 285, height: 30, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_bg', loop: true,
      keyframes: [
        { frame: 75, x: 548, y: 33, width: 160, height: 46, opacity: 0, scaleX: 0.9, scaleY: 0.9 },
        { frame: 110, x: 548, y: 22, width: 160, height: 46, opacity: 1, scaleX: 1, scaleY: 1, easing: 'back.out' },
        { frame: 270, x: 548, y: 22, width: 160, height: 46, opacity: 1, scaleX: 1, scaleY: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_text', loop: true,
      keyframes: [
        { frame: 90, x: 548, y: 22, width: 160, height: 46, opacity: 0 },
        { frame: 120, x: 548, y: 22, width: 160, height: 46, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 548, y: 22, width: 160, height: 46, opacity: 1 },
      ],
    } as AnimationData,
  ],
};

// ---------------------------------------------------------------------------
// Scene 3: 160×600 — Wide Skyscraper
// ---------------------------------------------------------------------------
const scene3: AnimationScene = {
  id: '160x600-meridian',
  name: '160×600 — Wide Skyscraper',
  stageSize: { width: 160, height: 600 },
  totalDuration: 5,
  fps: 60,
  currentFrame: 0,
  isPlaying: false,
  hasUnsavedChanges: false,
  layers: [
    {
      id: 'bg', name: 'bg', type: 'gradient',
      x: 0, y: 0, width: 160, height: 600,
      visible: true, opacity: 1, blendMode: 'normal',
      gradient: {
        type: 'linear',
        stops: [{ color: NAVY, position: 0 }, { color: NAVY_DARK2, position: 1 }],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
      },
    } as LayerData,
    {
      id: 'top_bar', name: 'top_bar', type: 'color',
      x: 0, y: 0, width: 160, height: 4,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'bot_bar', name: 'bot_bar', type: 'color',
      x: 0, y: 596, width: 160, height: 4,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'logo_name', name: 'logo_name', type: 'text',
      x: 10, y: 68, width: 140, height: 28,
      content: 'MERIDIAN',
      font: { family: 'Arial', size: 20, weight: 800, style: 'normal', letterSpacing: 3, lineHeight: 1.2 },
      fill: WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'logo_bank', name: 'logo_bank', type: 'text',
      x: 10, y: 98, width: 140, height: 16,
      content: 'BANK',
      font: { family: 'Arial', size: 10, weight: 400, style: 'normal', letterSpacing: 7, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'divider_1', name: 'divider_1', type: 'color',
      x: 45, y: 125, width: 70, height: 1,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'tagline_1', name: 'tagline_1', type: 'text',
      x: 10, y: 134, width: 140, height: 24,
      content: 'Your Future,',
      font: { family: 'Arial', size: 14, weight: 400, style: 'italic', letterSpacing: 0.5, lineHeight: 1.4 },
      fill: GOLD, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'tagline_2', name: 'tagline_2', type: 'text',
      x: 10, y: 159, width: 140, height: 24,
      content: 'Secured.',
      font: { family: 'Arial', size: 14, weight: 400, style: 'italic', letterSpacing: 0.5, lineHeight: 1.4 },
      fill: GOLD, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'offer_label', name: 'offer_label', type: 'text',
      x: 10, y: 256, width: 140, height: 18,
      content: 'EXCLUSIVE OFFER',
      font: { family: 'Arial', size: 8, weight: 700, style: 'normal', letterSpacing: 2, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'offer_main', name: 'offer_main', type: 'text',
      x: 10, y: 278, width: 140, height: 62,
      content: '0%',
      font: { family: 'Arial', size: 52, weight: 800, style: 'normal', letterSpacing: 0, lineHeight: 1 },
      fill: WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'offer_detail', name: 'offer_detail', type: 'text',
      x: 10, y: 345, width: 140, height: 20,
      content: 'fees for 12 months',
      font: { family: 'Arial', size: 11, weight: 400, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'divider_2', name: 'divider_2', type: 'color',
      x: 45, y: 378, width: 70, height: 1,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_bg', name: 'cta_bg', type: 'color',
      x: 15, y: 400, width: 130, height: 40,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_text', name: 'cta_text', type: 'text',
      x: 15, y: 400, width: 130, height: 40,
      content: 'Open an Account',
      font: { family: 'Arial', size: 11, weight: 700, style: 'normal', letterSpacing: 0.5, lineHeight: 1.2 },
      fill: NAVY, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'url', name: 'url', type: 'text',
      x: 10, y: 455, width: 140, height: 16,
      content: 'meridianbank.com',
      font: { family: 'Arial', size: 9, weight: 400, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
  ],
  animations: [
    {
      layerId: 'logo_name', loop: true,
      keyframes: [
        { frame: 20, x: 10, y: 82, width: 140, height: 28, opacity: 0 },
        { frame: 65, x: 10, y: 68, width: 140, height: 28, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 10, y: 68, width: 140, height: 28, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'logo_bank', loop: true,
      keyframes: [
        { frame: 35, x: 10, y: 98, width: 140, height: 16, opacity: 0 },
        { frame: 75, x: 10, y: 98, width: 140, height: 16, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 10, y: 98, width: 140, height: 16, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'divider_1', loop: true,
      keyframes: [
        { frame: 55, x: 80, y: 125, width: 0, height: 1, opacity: 1 },
        { frame: 80, x: 45, y: 125, width: 70, height: 1, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 45, y: 125, width: 70, height: 1, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'tagline_1', loop: true,
      keyframes: [
        { frame: 65, x: 10, y: 134, width: 140, height: 24, opacity: 0 },
        { frame: 100, x: 10, y: 134, width: 140, height: 24, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 10, y: 134, width: 140, height: 24, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'tagline_2', loop: true,
      keyframes: [
        { frame: 80, x: 10, y: 159, width: 140, height: 24, opacity: 0 },
        { frame: 115, x: 10, y: 159, width: 140, height: 24, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 10, y: 159, width: 140, height: 24, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'offer_label', loop: true,
      keyframes: [
        { frame: 100, x: 10, y: 256, width: 140, height: 18, opacity: 0 },
        { frame: 130, x: 10, y: 256, width: 140, height: 18, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 10, y: 256, width: 140, height: 18, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'offer_main', loop: true,
      keyframes: [
        { frame: 110, x: 10, y: 295, width: 140, height: 62, opacity: 0, scaleX: 0.85, scaleY: 0.85 },
        { frame: 145, x: 10, y: 278, width: 140, height: 62, opacity: 1, scaleX: 1, scaleY: 1, easing: 'back.out' },
        { frame: 270, x: 10, y: 278, width: 140, height: 62, opacity: 1, scaleX: 1, scaleY: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'offer_detail', loop: true,
      keyframes: [
        { frame: 130, x: 10, y: 345, width: 140, height: 20, opacity: 0 },
        { frame: 160, x: 10, y: 345, width: 140, height: 20, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 10, y: 345, width: 140, height: 20, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'divider_2', loop: true,
      keyframes: [
        { frame: 145, x: 80, y: 378, width: 0, height: 1, opacity: 1 },
        { frame: 170, x: 45, y: 378, width: 70, height: 1, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 45, y: 378, width: 70, height: 1, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_bg', loop: true,
      keyframes: [
        { frame: 155, x: 15, y: 407, width: 130, height: 40, opacity: 0, scaleX: 0.9, scaleY: 0.9 },
        { frame: 185, x: 15, y: 400, width: 130, height: 40, opacity: 1, scaleX: 1, scaleY: 1, easing: 'back.out' },
        { frame: 270, x: 15, y: 400, width: 130, height: 40, opacity: 1, scaleX: 1, scaleY: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_text', loop: true,
      keyframes: [
        { frame: 170, x: 15, y: 400, width: 130, height: 40, opacity: 0 },
        { frame: 195, x: 15, y: 400, width: 130, height: 40, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 15, y: 400, width: 130, height: 40, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'url', loop: true,
      keyframes: [
        { frame: 185, x: 10, y: 455, width: 140, height: 16, opacity: 0 },
        { frame: 210, x: 10, y: 455, width: 140, height: 16, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 10, y: 455, width: 140, height: 16, opacity: 1 },
      ],
    } as AnimationData,
  ],
};

// ---------------------------------------------------------------------------
// Scene 4: 300×600 — Half Page
// ---------------------------------------------------------------------------
const scene4: AnimationScene = {
  id: '300x600-meridian',
  name: '300×600 — Half Page',
  stageSize: { width: 300, height: 600 },
  totalDuration: 5,
  fps: 60,
  currentFrame: 0,
  isPlaying: false,
  hasUnsavedChanges: false,
  layers: [
    {
      id: 'bg', name: 'bg', type: 'gradient',
      x: 0, y: 0, width: 300, height: 600,
      visible: true, opacity: 1, blendMode: 'normal',
      gradient: {
        type: 'linear',
        stops: [{ color: NAVY, position: 0 }, { color: NAVY_DARK2, position: 1 }],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
      },
    } as LayerData,
    {
      id: 'top_bar', name: 'top_bar', type: 'color',
      x: 0, y: 0, width: 300, height: 4,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'bot_bar', name: 'bot_bar', type: 'color',
      x: 0, y: 596, width: 300, height: 4,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'hero_accent', name: 'hero_accent', type: 'gradient',
      x: 0, y: 4, width: 300, height: 160,
      visible: true, opacity: 1, blendMode: 'normal',
      gradient: {
        type: 'linear',
        stops: [{ color: '#1E5490', position: 0 }, { color: NAVY, position: 1 }],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
      },
    } as LayerData,
    {
      id: 'logo_name', name: 'logo_name', type: 'text',
      x: 20, y: 60, width: 260, height: 44,
      content: 'MERIDIAN',
      font: { family: 'Arial', size: 36, weight: 800, style: 'normal', letterSpacing: 4, lineHeight: 1.2 },
      fill: WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'logo_bank', name: 'logo_bank', type: 'text',
      x: 20, y: 106, width: 260, height: 20,
      content: 'BANK',
      font: { family: 'Arial', size: 12, weight: 400, style: 'normal', letterSpacing: 8, lineHeight: 1.2 },
      fill: GOLD, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'divider_1', name: 'divider_1', type: 'color',
      x: 110, y: 138, width: 80, height: 2,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'tagline', name: 'tagline', type: 'text',
      x: 20, y: 148, width: 260, height: 40,
      content: 'Your Future, Secured.',
      font: { family: 'Arial', size: 16, weight: 400, style: 'italic', letterSpacing: 0.5, lineHeight: 1.4 },
      fill: GOLD, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_1_bg', name: 'benefit_1_bg', type: 'color',
      x: 20, y: 228, width: 260, height: 56,
      fill: NAVY_CARD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_1_icon', name: 'benefit_1_icon', type: 'color',
      x: 28, y: 240, width: 8, height: 32,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_1_text', name: 'benefit_1_text', type: 'text',
      x: 46, y: 240, width: 224, height: 20,
      content: '0% Fees for 12 Months',
      font: { family: 'Arial', size: 14, weight: 700, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_1_sub', name: 'benefit_1_sub', type: 'text',
      x: 46, y: 262, width: 224, height: 16,
      content: 'No minimum balance required',
      font: { family: 'Arial', size: 10, weight: 400, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_2_bg', name: 'benefit_2_bg', type: 'color',
      x: 20, y: 296, width: 260, height: 56,
      fill: NAVY_CARD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_2_icon', name: 'benefit_2_icon', type: 'color',
      x: 28, y: 308, width: 8, height: 32,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_2_text', name: 'benefit_2_text', type: 'text',
      x: 46, y: 308, width: 224, height: 20,
      content: 'Free Online Banking',
      font: { family: 'Arial', size: 14, weight: 700, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_2_sub', name: 'benefit_2_sub', type: 'text',
      x: 46, y: 330, width: 224, height: 16,
      content: '24/7 access from anywhere',
      font: { family: 'Arial', size: 10, weight: 400, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_3_bg', name: 'benefit_3_bg', type: 'color',
      x: 20, y: 364, width: 260, height: 56,
      fill: NAVY_CARD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_3_icon', name: 'benefit_3_icon', type: 'color',
      x: 28, y: 376, width: 8, height: 32,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_3_text', name: 'benefit_3_text', type: 'text',
      x: 46, y: 376, width: 224, height: 20,
      content: 'FDIC Insured up to $250K',
      font: { family: 'Arial', size: 14, weight: 700, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'benefit_3_sub', name: 'benefit_3_sub', type: 'text',
      x: 46, y: 398, width: 224, height: 16,
      content: 'Your deposits are always protected',
      font: { family: 'Arial', size: 10, weight: 400, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_bg', name: 'cta_bg', type: 'color',
      x: 50, y: 450, width: 200, height: 48,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_text', name: 'cta_text', type: 'text',
      x: 50, y: 450, width: 200, height: 48,
      content: 'Open an Account',
      font: { family: 'Arial', size: 14, weight: 700, style: 'normal', letterSpacing: 0.5, lineHeight: 1.2 },
      fill: NAVY, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'url', name: 'url', type: 'text',
      x: 20, y: 515, width: 260, height: 18,
      content: 'meridianbank.com',
      font: { family: 'Arial', size: 10, weight: 400, style: 'normal', letterSpacing: 0, lineHeight: 1.2 },
      fill: OFF_WHITE, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
  ],
  animations: [
    {
      layerId: 'logo_name', loop: true,
      keyframes: [
        { frame: 15, x: 20, y: 75, width: 260, height: 44, opacity: 0 },
        { frame: 60, x: 20, y: 60, width: 260, height: 44, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 20, y: 60, width: 260, height: 44, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'logo_bank', loop: true,
      keyframes: [
        { frame: 30, x: 20, y: 106, width: 260, height: 20, opacity: 0 },
        { frame: 70, x: 20, y: 106, width: 260, height: 20, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 20, y: 106, width: 260, height: 20, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'divider_1', loop: true,
      keyframes: [
        { frame: 55, x: 150, y: 138, width: 0, height: 2, opacity: 1 },
        { frame: 80, x: 110, y: 138, width: 80, height: 2, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 110, y: 138, width: 80, height: 2, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'tagline', loop: true,
      keyframes: [
        { frame: 65, x: 20, y: 148, width: 260, height: 40, opacity: 0 },
        { frame: 100, x: 20, y: 148, width: 260, height: 40, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 20, y: 148, width: 260, height: 40, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_1_bg', loop: true,
      keyframes: [
        { frame: 90, x: 20, y: 228, width: 260, height: 56, opacity: 0 },
        { frame: 120, x: 20, y: 228, width: 260, height: 56, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 20, y: 228, width: 260, height: 56, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_1_icon', loop: true,
      keyframes: [
        { frame: 90, x: 28, y: 240, width: 8, height: 32, opacity: 0 },
        { frame: 120, x: 28, y: 240, width: 8, height: 32, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 28, y: 240, width: 8, height: 32, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_1_text', loop: true,
      keyframes: [
        { frame: 100, x: 46, y: 240, width: 224, height: 20, opacity: 0 },
        { frame: 130, x: 46, y: 240, width: 224, height: 20, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 46, y: 240, width: 224, height: 20, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_1_sub', loop: true,
      keyframes: [
        { frame: 110, x: 46, y: 262, width: 224, height: 16, opacity: 0 },
        { frame: 140, x: 46, y: 262, width: 224, height: 16, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 46, y: 262, width: 224, height: 16, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_2_bg', loop: true,
      keyframes: [
        { frame: 120, x: 20, y: 296, width: 260, height: 56, opacity: 0 },
        { frame: 150, x: 20, y: 296, width: 260, height: 56, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 20, y: 296, width: 260, height: 56, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_2_icon', loop: true,
      keyframes: [
        { frame: 120, x: 28, y: 308, width: 8, height: 32, opacity: 0 },
        { frame: 150, x: 28, y: 308, width: 8, height: 32, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 28, y: 308, width: 8, height: 32, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_2_text', loop: true,
      keyframes: [
        { frame: 130, x: 46, y: 308, width: 224, height: 20, opacity: 0 },
        { frame: 160, x: 46, y: 308, width: 224, height: 20, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 46, y: 308, width: 224, height: 20, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_2_sub', loop: true,
      keyframes: [
        { frame: 140, x: 46, y: 330, width: 224, height: 16, opacity: 0 },
        { frame: 170, x: 46, y: 330, width: 224, height: 16, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 46, y: 330, width: 224, height: 16, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_3_bg', loop: true,
      keyframes: [
        { frame: 150, x: 20, y: 364, width: 260, height: 56, opacity: 0 },
        { frame: 180, x: 20, y: 364, width: 260, height: 56, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 20, y: 364, width: 260, height: 56, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_3_icon', loop: true,
      keyframes: [
        { frame: 150, x: 28, y: 376, width: 8, height: 32, opacity: 0 },
        { frame: 180, x: 28, y: 376, width: 8, height: 32, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 28, y: 376, width: 8, height: 32, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_3_text', loop: true,
      keyframes: [
        { frame: 160, x: 46, y: 376, width: 224, height: 20, opacity: 0 },
        { frame: 190, x: 46, y: 376, width: 224, height: 20, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 46, y: 376, width: 224, height: 20, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'benefit_3_sub', loop: true,
      keyframes: [
        { frame: 170, x: 46, y: 398, width: 224, height: 16, opacity: 0 },
        { frame: 200, x: 46, y: 398, width: 224, height: 16, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 46, y: 398, width: 224, height: 16, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_bg', loop: true,
      keyframes: [
        { frame: 190, x: 50, y: 458, width: 200, height: 48, opacity: 0, scaleX: 0.9, scaleY: 0.9 },
        { frame: 220, x: 50, y: 450, width: 200, height: 48, opacity: 1, scaleX: 1, scaleY: 1, easing: 'back.out' },
        { frame: 270, x: 50, y: 450, width: 200, height: 48, opacity: 1, scaleX: 1, scaleY: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_text', loop: true,
      keyframes: [
        { frame: 205, x: 50, y: 450, width: 200, height: 48, opacity: 0 },
        { frame: 230, x: 50, y: 450, width: 200, height: 48, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 50, y: 450, width: 200, height: 48, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'url', loop: true,
      keyframes: [
        { frame: 220, x: 20, y: 515, width: 260, height: 18, opacity: 0 },
        { frame: 245, x: 20, y: 515, width: 260, height: 18, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 20, y: 515, width: 260, height: 18, opacity: 1 },
      ],
    } as AnimationData,
  ],
};

// ---------------------------------------------------------------------------
// Scene 5: 320×50 — Mobile Banner
// ---------------------------------------------------------------------------
const scene5: AnimationScene = {
  id: '320x50-meridian',
  name: '320×50 — Mobile Banner',
  stageSize: { width: 320, height: 50 },
  totalDuration: 5,
  fps: 60,
  currentFrame: 0,
  isPlaying: false,
  hasUnsavedChanges: false,
  layers: [
    {
      id: 'bg', name: 'bg', type: 'color',
      x: 0, y: 0, width: 320, height: 50,
      fill: NAVY, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'left_accent', name: 'left_accent', type: 'color',
      x: 0, y: 0, width: 3, height: 50,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'right_accent', name: 'right_accent', type: 'color',
      x: 317, y: 0, width: 3, height: 50,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'logo', name: 'logo', type: 'text',
      x: 12, y: 14, width: 155, height: 22,
      content: 'MERIDIAN BANK',
      font: { family: 'Arial', size: 13, weight: 800, style: 'normal', letterSpacing: 1.5, lineHeight: 1.2 },
      fill: WHITE, alignment: 'left', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'divider_v', name: 'divider_v', type: 'color',
      x: 178, y: 8, width: 1, height: 34,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_bg', name: 'cta_bg', type: 'color',
      x: 188, y: 7, width: 120, height: 36,
      fill: GOLD, visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
    {
      id: 'cta_text', name: 'cta_text', type: 'text',
      x: 188, y: 7, width: 120, height: 36,
      content: 'Open an Account',
      font: { family: 'Arial', size: 10, weight: 700, style: 'normal', letterSpacing: 0.3, lineHeight: 1.2 },
      fill: NAVY, alignment: 'center', rotation: 0,
      visible: true, opacity: 1, blendMode: 'normal',
    } as LayerData,
  ],
  animations: [
    {
      layerId: 'logo', loop: true,
      keyframes: [
        { frame: 0, x: -100, y: 14, width: 155, height: 22, opacity: 0 },
        { frame: 40, x: 12, y: 14, width: 155, height: 22, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 12, y: 14, width: 155, height: 22, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'divider_v', loop: true,
      keyframes: [
        { frame: 25, x: 178, y: 42, width: 1, height: 0, opacity: 1 },
        { frame: 55, x: 178, y: 8, width: 1, height: 34, opacity: 1, easing: 'power2.out' },
        { frame: 270, x: 178, y: 8, width: 1, height: 34, opacity: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_bg', loop: true,
      keyframes: [
        { frame: 45, x: 188, y: 18, width: 120, height: 36, opacity: 0, scaleX: 0.85, scaleY: 0.85 },
        { frame: 80, x: 188, y: 7, width: 120, height: 36, opacity: 1, scaleX: 1, scaleY: 1, easing: 'back.out' },
        { frame: 270, x: 188, y: 7, width: 120, height: 36, opacity: 1, scaleX: 1, scaleY: 1 },
      ],
    } as AnimationData,
    {
      layerId: 'cta_text', loop: true,
      keyframes: [
        { frame: 60, x: 188, y: 7, width: 120, height: 36, opacity: 0 },
        { frame: 90, x: 188, y: 7, width: 120, height: 36, opacity: 1, easing: 'power1.out' },
        { frame: 270, x: 188, y: 7, width: 120, height: 36, opacity: 1 },
      ],
    } as AnimationData,
  ],
};

// ---------------------------------------------------------------------------
// Exported project
// ---------------------------------------------------------------------------
export const demoProject: ProjectData = {
  scenes: [scene1, scene2, scene3, scene4, scene5],
};

export const demoProjectDefaultSceneId = '300x250-meridian';
