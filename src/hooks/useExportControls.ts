import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { exportHTML5Package as runExportHTML5Package, generateScenePackageBlob } from '../utils/exportHTML5';
import type { AnimationScene, ExportConfig, ExportTarget, LayerData, AnimationData } from '@/types/index';
import type { ExportLogEntry } from '../components/ExportProgressModal';

interface ActiveSceneExportData {
  layers: LayerData[];
  animations: AnimationData[];
  fps: number;
  totalFrames: number;
  stageSize: { width: number; height: number };
}

interface UseExportControlsReturn {
  // state
  exporting: boolean;
  isBatchExporting: boolean;
  isExportPreviewOpen: boolean;
  isExportProgressOpen: boolean;
  exportIsComplete: boolean;
  exportLog: ExportLogEntry[];
  exportTarget: ExportTarget;
  exportFilename: string;
  // setters for settings
  setExportTarget: (v: ExportTarget) => void;
  setExportFilename: (v: string) => void;
  setIsExportPreviewOpen: (v: boolean) => void;
  setIsExportProgressOpen: (v: boolean) => void;
  // actions
  exportHTML5Package: () => Promise<void>;
  handleBatchExport: () => Promise<void>;
}

interface UseExportControlsOptions {
  activeScene: ActiveSceneExportData;
  scenes: AnimationScene[];
}

export function useExportControls({
  activeScene,
  scenes,
}: UseExportControlsOptions): UseExportControlsReturn {
  const [exporting, setExporting] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [isExportProgressOpen, setIsExportProgressOpen] = useState(false);
  const [exportIsComplete, setExportIsComplete] = useState(false);
  const [exportLog, setExportLog] = useState<ExportLogEntry[]>([]);
  const [exportTarget, setExportTarget] = useState<ExportTarget>('generic');
  const [exportFilename, setExportFilename] = useState('ad_package');

  const exportHTML5Package = useCallback(async () => {
    setExporting(true);
    setExportLog([]);
    setExportIsComplete(false);
    setIsExportProgressOpen(true);

    const appendLog = (type: ExportLogEntry['type'], message: string) => {
      setExportLog(prev => [...prev, { type, message }]);
    };

    try {
      const { width, height } = activeScene.stageSize;
      await runExportHTML5Package(
        {
          layers: activeScene.layers,
          animations: activeScene.animations,
          fps: activeScene.fps,
          totalFrames: activeScene.totalFrames,
          stageSize: activeScene.stageSize,
          target: exportTarget,
          filename: `${exportFilename}_${width}x${height}`,
        },
        (message: string) => appendLog('info', message),
        (warning: string) => appendLog('warning', warning)
      );
      appendLog('info', 'Export complete.');
    } catch (error) {
      console.error('Error during HTML5 package export:', error);
      appendLog('error', `Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExporting(false);
      setExportIsComplete(true);
    }
  }, [activeScene, exportTarget, exportFilename]);

  const handleBatchExport = useCallback(async () => {
    if (isBatchExporting || scenes.length <= 1) return;

    setIsBatchExporting(true);
    setExportLog([]);
    setExportIsComplete(false);
    setIsExportProgressOpen(true);

    const appendLog = (type: ExportLogEntry['type'], message: string) => {
      setExportLog(prev => [...prev, { type, message }]);
    };

    const masterZip = new JSZip();
    let successCount = 0;
    let errorCount = 0;
    const exportedFiles: string[] = [];

    try {
      appendLog('info', `Batch exporting ${scenes.length} scenes...`);

      for (const scene of scenes) {
        const { width, height } = scene.stageSize;
        const sceneFileName = `${exportFilename}_${width}x${height}.zip`;
        appendLog('info', `── ${scene.name} (${width}×${height}) ──`);

        try {
          const sceneConfig: ExportConfig = {
            layers: scene.layers,
            animations: scene.animations,
            fps: scene.fps,
            totalFrames: Math.max(1, Math.floor(scene.totalDuration * scene.fps)),
            stageSize: scene.stageSize,
            target: exportTarget,
          };

          const sceneBlob = await generateScenePackageBlob(
            sceneConfig,
            (msg) => appendLog('info', `  ${msg}`),
            (warn) => appendLog('warning', `  ${warn}`)
          );

          masterZip.file(sceneFileName, sceneBlob);
          exportedFiles.push(sceneFileName);
          successCount++;
        } catch (sceneError) {
          appendLog('error', `  Failed: ${sceneError instanceof Error ? sceneError.message : String(sceneError)}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        appendLog('info', 'Generating master ZIP...');
        const masterBlob = await masterZip.generateAsync({ type: 'blob' });
        const masterSizeKB = (masterBlob.size / 1024).toFixed(1);
        saveAs(masterBlob, `${exportFilename}.zip`);

        appendLog('info', '');
        appendLog('info', `Batch export complete — ${successCount}/${scenes.length} scene(s) exported.`);
        appendLog('info', `Master ZIP: ${exportFilename}.zip (${masterSizeKB} KB)`);
        appendLog('info', 'Files in package:');
        exportedFiles.forEach(f => appendLog('info', `  ${f}`));

        if (errorCount > 0) {
          appendLog('warning', `${errorCount} scene(s) failed to export.`);
        }
      } else {
        appendLog('error', 'Batch export failed: no scenes were successfully exported.');
      }
    } catch (masterError) {
      appendLog('error', `Unexpected error: ${masterError instanceof Error ? masterError.message : String(masterError)}`);
    } finally {
      setIsBatchExporting(false);
      setExportIsComplete(true);
    }
  }, [scenes, isBatchExporting, exportFilename, exportTarget]);

  return {
    exporting,
    isBatchExporting,
    isExportPreviewOpen,
    isExportProgressOpen,
    exportIsComplete,
    exportLog,
    exportTarget,
    exportFilename,
    setExportTarget,
    setExportFilename,
    setIsExportPreviewOpen,
    setIsExportProgressOpen,
    exportHTML5Package,
    handleBatchExport,
  };
}
