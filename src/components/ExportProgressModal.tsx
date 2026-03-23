import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

export interface ExportLogEntry {
  type: 'info' | 'warning' | 'error';
  message: string;
}

interface ExportProgressModalProps {
  isOpen: boolean;
  isComplete: boolean;
  log: ExportLogEntry[];
  onClose: () => void;
}

const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  isComplete,
  log,
  onClose,
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const warnings = log.filter(e => e.type === 'warning');

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v && isComplete) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete
              ? <CheckCircle className="h-5 w-5 text-green-500" />
              : <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {isComplete ? 'Export Complete' : 'Exporting…'}
          </DialogTitle>
        </DialogHeader>

        {/* Log */}
        <div className="bg-muted/40 rounded-md p-3 max-h-72 overflow-y-auto font-mono text-xs space-y-0.5">
          {log.map((entry, i) => (
            <div key={i} className={`flex items-start gap-1.5 ${entry.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground/80'}`}>
              {entry.type === 'warning'
                ? <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                : <Info className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />}
              <span>{entry.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* IAB validation summary */}
        {isComplete && warnings.length > 0 && (
          <div className="rounded-md border border-amber-400/30 bg-amber-50/50 dark:bg-amber-900/10 p-3 text-xs space-y-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> IAB Validation Warnings
            </p>
            {warnings.map((w, i) => (
              <p key={i} className="text-amber-700 dark:text-amber-300">{w.message}</p>
            ))}
            <p className="text-muted-foreground pt-1">Consider reducing image sizes to stay within the 150 KB limit.</p>
          </div>
        )}

        {isComplete && (
          <Button onClick={onClose} className="w-full">Close</Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExportProgressModal;
