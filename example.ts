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
      const throttleInterval = 50; // Minimum time (in ms) between executions
      let isRangeSelectionActive = false; // Track if range selection is in progress

      return function (params) {
        const now = Date.now();
        
        // Check if this is a Shift key operation (range selection)
        // Properly cast the event and check shiftKey with type safety
        if (params.event) {
          isRangeSelectionActive = (params.event as KeyboardEvent).shiftKey === true;
        } else {
          isRangeSelectionActive = false;
        }

        // If this is range selection, don't interfere with AG Grid's native behavior
        if (isRangeSelectionActive) {
          // Just throttle but don't interfere with selection behavior
          if (now - lastExecutionTime < throttleInterval) {
            return null; // Still throttle rapid keypresses
          }
          lastExecutionTime = now;
          return params.nextCellPosition; // Allow normal range selection
        }
        
        // For normal navigation (not range selection)
        if (now - lastExecutionTime < throttleInterval) {
          return null; // Prevent navigation when throttling
        }

        lastExecutionTime = now; // Update the last execution time

        // For regular navigation, we'll handle it ourselves for better control
        const suggestedNextCell = params.nextCellPosition;
        if (suggestedNextCell) {
          // Use setTimeout to prevent UI freezing with large datasets
          setTimeout(() => {
            params.api.setFocusedCell(suggestedNextCell.rowIndex, suggestedNextCell.column);
            params.api.ensureColumnVisible(suggestedNextCell.column);
            params.api.ensureIndexVisible(suggestedNextCell.rowIndex);
          }, 0);
          
          return suggestedNextCell; // Allow navigation to proceed
        }
        
        return null;
      };
    })(),
    tabToNextCell: (function () {
      let lastExecutionTime = 0; // Tracks the last execution time
      const throttleInterval = 50; // Minimum time (in ms) between executions
      let isRangeSelectionActive = false; // Track if range selection is in progress

      return function (params) {
        const now = Date.now();
        
        // TabToNextCellParams doesn't have an event property, so we need to handle differently
        // We can detect if this is a backward navigation (shift+tab) by checking the direction
        isRangeSelectionActive = params.backwards === true;

        // If this is backward navigation, don't interfere with AG Grid's native behavior
        if (isRangeSelectionActive) {
          // Just throttle but don't interfere with selection behavior
          if (now - lastExecutionTime < throttleInterval) {
            return false; // Still throttle rapid keypresses
          }
          lastExecutionTime = now;
          return params.nextCellPosition; // Allow normal navigation
        }
        
        // For normal navigation (not range selection)
        if (now - lastExecutionTime < throttleInterval) {
          return false; // Prevent navigation when throttling
        }

        lastExecutionTime = now; // Update the last execution time

        // For regular navigation, we'll handle it ourselves for better control
        const suggestedNextCell = params.nextCellPosition;
        if (suggestedNextCell) {
          // Use setTimeout to prevent UI freezing with large datasets
          setTimeout(() => {
            params.api.setFocusedCell(suggestedNextCell.rowIndex, suggestedNextCell.column);
            params.api.ensureColumnVisible(suggestedNextCell.column);
            params.api.ensureIndexVisible(suggestedNextCell.rowIndex);
          }, 0);
          
          return suggestedNextCell; // Allow navigation to proceed
        }
        
        return false;
      };
    })(),
