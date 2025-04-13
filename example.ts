// high-performance-nav-throttle.ts
import { GridApi } from 'ag-grid-community';

export function setupHighPerformanceNavThrottle(api: GridApi): void {
  const gridRoot = document.querySelector<HTMLElement>('.ag-root');
  if (!gridRoot) return;

  let ticking = false;

  const frameThrottler = (e: KeyboardEvent) => {
    const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

    if (!navKeys.includes(e.key)) return;

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
      });
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  gridRoot.addEventListener('keydown', frameThrottler, true);

  api.addEventListener('gridDestroyed', () => {
    gridRoot.removeEventListener('keydown', frameThrottler, true);
  });
}



navigateToNextCell: (function () {
      let lastExecutionTime = 0; // Tracks the last execution time
      const throttleInterval = 70; // Increased throttle interval for expanded groups
      let lastDirection: string | null = null; // Track the direction of navigation
      let consecutiveCallsInSameDirection = 0;
      const MAX_CONSECUTIVE_CALLS = 3; // Limit how many consecutive calls in the same direction before enforcing a delay

      return function (params) {
        const now = Date.now();
        
        // Get the current direction (keyboard key)
        const currentDirection = params.key;
        
        // Check if we're still navigating in the same direction
        if (currentDirection === lastDirection) {
          consecutiveCallsInSameDirection++;
        } else {
          consecutiveCallsInSameDirection = 0;
          lastDirection = currentDirection;
        }
        
        // Special handling for grouped and expanded data
        if (params.api.getDisplayedRowCount() > 1000) {
          // For large datasets with multiple groups expanded
          
          // When continuously navigating in same direction
          if (consecutiveCallsInSameDirection > MAX_CONSECUTIVE_CALLS) {
            // Apply a more aggressive throttle to avoid freezing
            if (now - lastExecutionTime < throttleInterval * 2) {
              return null; // Skip this navigation step
            }
          } else {
            // Standard throttling for first few keypresses
            if (now - lastExecutionTime < throttleInterval) {
              return null;
            }
          }
        } else {
          // Standard throttling for smaller datasets or collapsed groups
          if (now - lastExecutionTime < throttleInterval) {
            return null; 
          }
        }
        
        lastExecutionTime = now;
        
        // For shift-key range selection, just return the next position
        if (params.event && (params.event as KeyboardEvent).shiftKey) {
          return params.nextCellPosition;
        }
        
        // Standard navigation - let AG Grid handle it naturally
        // This is a key improvement - avoiding unnecessary DOM operations
        return params.nextCellPosition;
      };
    })(),




  
    tabToNextCell: (function () {
      let lastExecutionTime = 0; // Tracks the last execution time
      const throttleInterval = 70; // Increased for better performance
      let consecutiveTabCalls = 0;
      const MAX_CONSECUTIVE_TABS = 3;

      return function (params) {
        const now = Date.now();
        
        // Track consecutive tab key presses
        consecutiveTabCalls++;
        
        // Special handling for grouped and expanded data
        if (params.api.getDisplayedRowCount() > 1000) {
          // For large datasets with multiple groups expanded
          if (consecutiveTabCalls > MAX_CONSECUTIVE_TABS) {
            // Apply a more aggressive throttle to avoid freezing
            if (now - lastExecutionTime < throttleInterval * 2) {
              return false; // Skip this navigation
            }
          } else {
            // Standard throttling for first few keypresses
            if (now - lastExecutionTime < throttleInterval) {
              return false;
            }
          }
        } else {
          // Standard throttling for smaller datasets
          if (now - lastExecutionTime < throttleInterval) {
            return false;
          }
        }
        
        lastExecutionTime = now;
        
        // For shift+tab backward navigation
        if (params.backwards) {
          return params.nextCellPosition;
        }
        
        // Standard navigation - let AG Grid handle it naturally
        return params.nextCellPosition;
      };
    })()
