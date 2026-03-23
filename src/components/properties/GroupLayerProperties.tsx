import React from 'react';
import { GroupLayerData } from '@/types/index';

interface GroupLayerPropertiesProps {
  selectedLayer: GroupLayerData;
}

const GroupLayerProperties: React.FC<GroupLayerPropertiesProps> = ({ 
  selectedLayer 
}) => {
  return (
    <div className="space-y-2 pt-4 border-t border-border mt-4">
      <h3 className="text-sm font-semibold">Group Properties</h3>
      <p className="text-xs text-muted-foreground">
        Contains {selectedLayer.children?.length || 0} layer(s).
      </p>
      {/* Add group-specific controls here if needed later */}
    </div>
  );
};

export default GroupLayerProperties; 