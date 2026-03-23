import React, { useState, useEffect, useRef } from 'react';

interface InlineTextEditorProps {
  x: number;
  y: number;
  width: number | null; // Allow null
  height: number | null; // Allow null
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  initialValue?: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
}

const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  x, y, width, height, fontSize = 16, fontFamily = 'Arial', fill = '#000000',
  initialValue = '', onSave, onCancel
}) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the textarea when the component mounts
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const handleBlur = () => {
    // Save on blur
    onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline on Enter
      onSave(value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Basic styling - adjust as needed
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: width ? `${width}px` : 'auto', // Use 'auto' width if null
    height: height ? `${height}px` : 'auto', // Use 'auto' height if null
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    lineHeight: 1.2, // Adjust line height for better fit
    color: fill,
    border: '1px solid #ccc',
    padding: '2px',
    margin: 0,
    overflow: 'hidden', // Hide scrollbars if possible
    background: 'white',
    outline: 'none',
    resize: 'none', // Disable manual resize handle
    zIndex: 1000, // Ensure it's above the canvas
    whiteSpace: 'pre-wrap', // Preserve whitespace and wrap
    wordWrap: 'break-word', // Break long words
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={style}
    />
  );
};

export default InlineTextEditor; 