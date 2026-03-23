import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook that provides a repeating action when a button is held down.
 * 
 * This hook uses a combination of setTimeout and setInterval to:
 * 1. Execute the action immediately on mousedown
 * 2. Wait for an initial delay
 * 3. Begin repeating the action at the specified interval
 * 
 * @param action - The function to execute repeatedly
 * @param initialDelay - Time in ms before repeating starts (default: 200ms)
 * @param repeatInterval - Time in ms between repeated actions (default: 80ms)
 * @returns An object with an onMouseDown handler to attach to a button
 */
export const useRepeatingAction = (action: () => void, initialDelay = 200, repeatInterval = 80) => {
  // References to track timers
  const initialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Create a ref for the mouseup handler to break circular dependency
  const handleGlobalMouseUpRef = useRef<() => void>(() => {});
  
  // Cleanup function to cancel all timers and remove event listeners
  const cleanup = useCallback(() => {
    if (initialTimerRef.current !== null) {
      clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    }
    if (repeatTimerRef.current !== null) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    
    // Remove the global mouseup listener
    document.removeEventListener('mouseup', handleGlobalMouseUpRef.current);
  }, []);
  
  // Global mouseup handler to stop repeating when the button is released anywhere
  // Assign the function to our ref to break the circular dependency
  handleGlobalMouseUpRef.current = () => {
    cleanup();
  };
  
  // Handle mousedown on the button
  const handleMouseDown = useCallback(() => {
    // Clean up any existing timers first (in case of multiple rapid clicks)
    cleanup();
    
    // Execute action immediately on press
    if (typeof action === 'function') {
      action();
    } else {
      console.warn('useRepeatingAction: action is not a function');
      return;
    }
    
    // Set up delayed repeat
    initialTimerRef.current = setTimeout(() => {
      // Start repeating after initial delay
      repeatTimerRef.current = setInterval(() => {
        action();
      }, Math.max(10, repeatInterval)); // Ensure a minimum interval
    }, Math.max(50, initialDelay)); // Ensure a minimum delay
    
    // Add global mouseup listener to detect release anywhere in the document
    document.addEventListener('mouseup', handleGlobalMouseUpRef.current);
  }, [action, cleanup, initialDelay, repeatInterval]);
  
  // Ensure cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return {
    onMouseDown: handleMouseDown
  };
}; 