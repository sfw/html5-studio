import { useState, useEffect } from 'react';
import type { AnimationScene, ImageCache, ImageLayerData } from '@/types/index';
import { isLocalSrc } from '../utils/urlUtils';

export function useImageLoader(scenes: AnimationScene[]): ImageCache {
  const [images, setImages] = useState<ImageCache>({});

  useEffect(() => {
    const loadImages = async () => {
      let changedCache = false;
      const nextImages = { ...images };

      // --- Step 1: Process Local Sources Needing Caching ---
      scenes.forEach(scene => {
        scene.layers
          .filter((layer): layer is ImageLayerData & { src: string } =>
            layer.type === 'image' && typeof layer.src === 'string' && layer.src.length > 0 && isLocalSrc(layer.src)
          )
          .forEach(layer => {
            if (!nextImages[layer.src]) {
              try {
                const img = new Image();
                img.onload = () => console.log(`[useImageLoader] Local image loaded for ${layer.id}`);
                img.onerror = () => console.error(`[useImageLoader] Local image failed for ${layer.id}`);
                img.src = layer.src;
                nextImages[layer.src] = img;
                changedCache = true;
              } catch (error) {
                console.error(`[useImageLoader] Error creating Image for local src ${layer.id}:`, error);
              }
            }
          });
      });

      // --- Step 2: Identify External Sources Needing Loading ---
      const uniqueImageSourcesToLoad = new Set<string>();
      scenes.forEach(scene => {
        scene.layers
          .filter((layer): layer is ImageLayerData & { src: string } =>
            layer.type === 'image' && typeof layer.src === 'string' && layer.src.length > 0 && !isLocalSrc(layer.src)
          )
          .forEach(layer => {
            if (!nextImages[layer.src]) {
              uniqueImageSourcesToLoad.add(layer.src);
            }
          });
      });

      // --- Step 3: Load External Sources ---
      if (uniqueImageSourcesToLoad.size > 0) {
        const promises = Array.from(uniqueImageSourcesToLoad).map(src =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              nextImages[src] = img;
              changedCache = true;
              resolve();
            };
            img.onerror = (err) => {
              console.error(`[useImageLoader] Failed external: ${src}`, err);
              resolve();
            };
            const isAbsoluteUrl = src.startsWith('http');
            img.src = isAbsoluteUrl ? src : `/templates/assets/${src}`;
          })
        );
        await Promise.allSettled(promises);
      }

      // --- Step 4: Update State IF Cache Changed ---
      if (changedCache) {
        setImages(nextImages);
      }
    };

    if (scenes.length > 0) {
      loadImages();
    }
  }, [scenes, images]);

  return images;
}
