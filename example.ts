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
  let lastExecutionTime = 0;
  const throttleInterval = 50;
  
  return function (params) {
    const now = Date.now();
    
    if (now - lastExecutionTime < throttleInterval) {
      return null;
    }
    
    lastExecutionTime = now;
    
    // Custom class for styling controlled cells
    const focusClass = 'custom-focused-cell';
    
    // Remove class from all cells first
    document.querySelectorAll('.' + focusClass).forEach(cell => {
      cell.classList.remove(focusClass);
    });
    
    const suggestedNextCell = params.nextCellPosition;
    
    if (suggestedNextCell) {
      params.api.ensureColumnVisible(suggestedNextCell.column);
      params.api.ensureIndexVisible(suggestedNextCell.rowIndex);
      params.api.setFocusedCell(suggestedNextCell.rowIndex, suggestedNextCell.column);
      
      // Add custom class to the newly focused cell
      setTimeout(() => {
        const focusedCell = document.querySelector('.ag-cell-focus');
        if (focusedCell) {
          focusedCell.classList.add(focusClass);
        }
      }, 0);
    }
    
    return null;
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
