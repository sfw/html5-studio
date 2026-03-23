import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import type { ExportConfig } from '@/types/index';
import { generatePreviewHTML } from '@/utils/exportHTML5';

interface ExportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  config: ExportConfig | null;
  onExport: () => void;
  exporting: boolean;
}

const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  open,
  onClose,
  config,
  onExport,
  exporting,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !config) return;

    const html = generatePreviewHTML(config);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setBlobUrl(null);
    };
  }, [open, config]);

  const reload = () => {
    if (!iframeRef.current || !blobUrl) return;
    iframeRef.current.src = blobUrl;
  };

  const { width = 300, height = 250 } = config?.stageSize ?? {};
  // Scale down if the ad is larger than ~600px wide in the modal
  const maxPreviewWidth = 600;
  const scale = Math.min(1, maxPreviewWidth / width);
  const scaledW = Math.round(width * scale);
  const scaledH = Math.round(height * scale);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export Preview — {width}×{height}px</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {blobUrl ? (
            <div
              className="border border-border rounded overflow-hidden bg-white"
              style={{ width: scaledW, height: scaledH }}
            >
              <iframe
                ref={iframeRef}
                src={blobUrl}
                title="Ad Preview"
                style={{
                  width,
                  height,
                  border: 'none',
                  transformOrigin: 'top left',
                  transform: scale < 1 ? `scale(${scale})` : undefined,
                  display: 'block',
                }}
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <div
              className="border border-border rounded bg-muted flex items-center justify-center text-muted-foreground text-sm"
              style={{ width: scaledW, height: scaledH }}
            >
              Loading preview…
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reload} disabled={!blobUrl}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Restart
            </Button>
            <Button size="sm" onClick={onExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-1" />
              {exporting ? 'Exporting…' : 'Download ZIP'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPreviewModal;
