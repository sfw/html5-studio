import { LayerData, ImageLayerData, FileParseResult, TemplateData, AnimationData, Keyframe, StageSize, TemplateModule } from '@/types/index';

const optimizeSvg = async (input: string): Promise<string> => {
  const { optimize } = await import('svgo/dist/svgo.browser.js');
  return optimize(input, {
    multipass: true,
    plugins: [{ name: 'preset-default' }],
  }).data;
};

// --- Define structure of the raw JSON template file ---
// (Matches the expected structure of TemplateModule's default export)
interface RawTemplateFileContent {
  stageSize?: Partial<StageSize>;
  layers?: LayerData[]; // Use full LayerData as JSON should conform
  animations?: AnimationData[]; // Use full AnimationData
  fps?: number;
  duration?: number;
}

export const parseFile = (file: File): Promise<FileParseResult> => {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        let text = e.target?.result as string;
        try {
          // Optimise (non-fatal — use original on failure)
          try {
            text = await optimizeSvg(text);
          } catch { /* keep original */ }

          // Parse SVG XML
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(text, 'image/svg+xml');

          // Detect parse errors
          if (svgDoc.querySelector('parsererror')) {
            resolve({ layers: [], error: 'Invalid SVG file.' });
            return;
          }

          const svgEl = svgDoc.documentElement;

          // Extract dimensions from viewBox, then width/height attributes
          let w = 300, h = 250;
          const viewBox = svgEl.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.trim().split(/[\s,]+/);
            if (parts.length >= 4) {
              const vw = parseFloat(parts[2]);
              const vh = parseFloat(parts[3]);
              if (vw > 0 && vh > 0) { w = vw; h = vh; }
            }
          } else {
            const attrW = svgEl.getAttribute('width');
            const attrH = svgEl.getAttribute('height');
            if (attrW) { const v = parseFloat(attrW); if (v > 0) w = v; }
            if (attrH) { const v = parseFloat(attrH); if (v > 0) h = v; }
          }

          // Ensure SVG has explicit width/height so browsers render it correctly as an <img>
          svgEl.setAttribute('width', String(w));
          svgEl.setAttribute('height', String(h));
          const finalSvgText = new XMLSerializer().serializeToString(svgDoc);

          // Create blob URL — SVG renders as a vector image via Konva Image node
          const blob = new Blob([finalSvgText], { type: 'image/svg+xml' });
          const blobUrl = URL.createObjectURL(blob);

          const layerName = file.name.replace(/\.svg$/i, '') || 'SVG';

          const layer: ImageLayerData = {
            id: `svg-layer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: layerName,
            type: 'image',
            src: blobUrl,
            fit: 'contain',
            x: 0,
            y: 0,
            width: w,
            height: h,
            visible: true,
            opacity: 1,
            rotation: 0,
            blendMode: 'normal',
          };

          resolve({ layers: [layer], svgSize: { width: w, height: h } });
        } catch (error) {
          console.error('Error parsing SVG:', error);
          resolve({ layers: [], error: 'Failed to parse SVG file. Please ensure it is a valid SVG.' });
        }
      };
      reader.onerror = () => resolve({ layers: [], error: 'Failed to read SVG file.' });
      reader.readAsText(file);
    } else if (file.name.endsWith('.ai')) {
      resolve({ layers: [], error: 'AI file processing is not yet implemented. Please convert to SVG.' });
    } else {
      resolve({ layers: [], error: 'Unsupported file type. Please upload an SVG or AI file.' });
    }
  });
};

export const validateFileType = (file: File): string | null => {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  if (isSvg || file.name.toLowerCase().endsWith('.ai')) {
    return null;
  }
  return 'Please upload an SVG or AI file.';
};

// --- Refactored Template Loading using import.meta.glob (Eager) --- 

// 1. Use import.meta.glob EAGERLY to include template content in the main bundle
const templateModules = import.meta.glob<TemplateModule>('../templates/*.json', { eager: true }); // Eager loading

// 2. Create a map directly storing the JSON content: { '300x250': templateJsonContent, ... }
const templateDataMap: Record<string, RawTemplateFileContent> = {}; 
for (const path in templateModules) {
  const match = path.match(/\.\.\/templates\/(.+)\.json$/);
  if (match && match[1]) {
    const templateSize = match[1];
    // Access the default export containing the JSON data
    const module = templateModules[path];
    if (module && module.default) {
       // Assert type before assignment (optional but good practice)
       templateDataMap[templateSize] = module.default as RawTemplateFileContent;
    } else {
      console.warn(`Template file ${path} loaded via glob but has no default export.`);
    }
  }
}

// 3. Update loadTemplateData to be SYNCHRONOUS and use the map
export const loadTemplateData = (templateSize: string): TemplateData => { // Remove async
 const template = templateDataMap[templateSize];
 if (!template) {
   console.error(`Template data for size "${templateSize}" not found in eager map.`);
   throw new Error(`Template size "${templateSize}" not found or failed to load eagerly.`);
 }
  
 console.log(`[Template Load] Loading template: ${templateSize}`);
 try {
   // Template data is already loaded, just process it
   if (typeof template !== 'object' || template === null) {
        throw new Error(`Eagerly loaded template data for "${templateSize}" is not a valid object.`);
   } 

   const templateFps = template.fps ?? 24;

   const layers = Array.isArray(template.layers) ? template.layers : [];

   const stageSize: StageSize = {
     width: template.stageSize?.width ?? 800,
     height: template.stageSize?.height ?? 600,
     devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
   };

   const animations = Array.isArray(template.animations) 
     ? template.animations.map((anim: AnimationData) => ({
         ...anim,
         keyframes: (anim.keyframes || []).map((kf: Partial<Keyframe> & { time?: number }): Keyframe => ({
           ...kf,
           frame: kf.frame ?? Math.round((kf.time ?? 0) * templateFps),
           easing: kf.easing ?? 'linear',
         }))
       }))
     : [];

   // Construct the final TemplateData object
   return {
     layers: layers, 
     animations: animations,
     stageSize: stageSize,
     duration: template.duration ?? 10,
     fps: templateFps,
     width: stageSize.width,
     height: stageSize.height,
   };

 } catch (error) {
   console.error(`Error processing template "${templateSize}":`, error);
   // Re-throw
   throw error instanceof Error ? error : new Error(`Failed to process template "${templateSize}".`); 
 }
}; 
