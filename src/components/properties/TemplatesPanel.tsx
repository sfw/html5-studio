import React from 'react';
import TemplateSelector from '@/components/TemplateSelector'; // Adjust path if needed

interface TemplatesPanelProps {
  onTemplateSelect: (templateSize: string) => void;
}

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ onTemplateSelect }) => {
  return (
    <TemplateSelector onSelect={onTemplateSelect} />
  );
};

export default TemplatesPanel; 