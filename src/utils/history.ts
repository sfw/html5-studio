import { HistoryState, HistoryAction, LayerData, AnimationData } from '@/types/index';

const MAX_HISTORY_STATES = 50;

export class HistoryManager {
  private states: HistoryState[] = [];
  private currentIndex: number = -1;

  constructor(initialState: HistoryState) {
    this.pushState(initialState);
  }

  private pushState(state: HistoryState) {
    // Remove any future states if we're not at the end
    this.states = this.states.slice(0, this.currentIndex + 1);
    
    // Add new state
    this.states.push({
      layers: JSON.parse(JSON.stringify(state.layers)), // Deep clone
      animations: JSON.parse(JSON.stringify(state.animations)),
      selectedLayerId: state.selectedLayerId
    });
    
    // Maintain max history size
    if (this.states.length > MAX_HISTORY_STATES) {
      this.states.shift();
    } else {
      this.currentIndex++;
    }
  }

  public addAction(_action: HistoryAction, newState: HistoryState) {
    this.pushState(newState);
    return this.getCurrentState();
  }

  public undo(): HistoryState | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentState();
    }
    return null;
  }

  public redo(): HistoryState | null {
    if (this.currentIndex < this.states.length - 1) {
      this.currentIndex++;
      return this.getCurrentState();
    }
    return null;
  }

  public getCurrentState(): HistoryState {
    return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }
}

// REMOVE Helper function to create history actions
// export const createHistoryAction = (
//   type: HistoryAction['type'],
//   payload: any // Use any here temporarily, creators will be specific
// ): HistoryAction => ({
//   type,
//   payload,
//   timestamp: Date.now()
// });

// Update Action creators to return the full HistoryAction object
export const createAddLayerAction = (layer: LayerData): HistoryAction => ({ // Return full object
  type: 'ADD_LAYER',
  payload: { layer }, 
  timestamp: Date.now()
});

export const createDeleteLayerAction = (layerId: string): HistoryAction => ({ // Return full object
  type: 'DELETE_LAYER',
  payload: { layerId }, 
  timestamp: Date.now()
});

export const createModifyLayerAction = (
  layerId: string, 
  changes: Partial<LayerData>
): HistoryAction => ({ // Return full object
  type: 'MODIFY_LAYER',
  payload: { layerId, changes }, 
  timestamp: Date.now()
});

export const createReorderLayersAction = (
  layerId: string,
  oldIndex: number,
  newIndex: number
): HistoryAction => ({ // Return full object
  type: 'REORDER_LAYERS',
  payload: { layerId, oldIndex, newIndex },
  timestamp: Date.now()
});

export const createModifyAnimationAction = (
  layerId: string,
  changes: Partial<AnimationData>
): HistoryAction => ({ // Return full object
  type: 'MODIFY_ANIMATION',
  payload: { layerId, changes }, 
  timestamp: Date.now()
}); 