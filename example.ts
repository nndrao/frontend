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

      return function (params) {
        const now = Date.now();

        // Throttle logic: Ignore calls that occur too soon after the last execution
        if (now - lastExecutionTime < throttleInterval) {
          return params.nextCellPosition; // Return the intended next cell to continue navigation
        }

        lastExecutionTime = now; // Update the last execution time

        // Custom navigation logic
        const suggestedNextCell = params.nextCellPosition;
        if (suggestedNextCell) {
          // Clear focus from any cells with ag-cell-focus class
          const focusedCells = document.querySelectorAll('.ag-cell-focus');
          focusedCells.forEach(cell => {
            cell.classList.remove('ag-cell-focus');
          });

          // Ensure new cell is visible and set focus to it
          params.api.ensureColumnVisible(suggestedNextCell.column);
          params.api.ensureIndexVisible(suggestedNextCell.rowIndex);
          params.api.setFocusedCell(suggestedNextCell.rowIndex, suggestedNextCell.column);
        }

        // Return the next position to allow the navigation to occur
        return suggestedNextCell;
      };
    })(),
    tabToNextCell: (function () {
      let lastExecutionTime = 0; // Tracks the last execution time
      const throttleInterval = 50; // Minimum time (in ms) between executions

      return function (params) {
        const now = Date.now();

        // Throttle logic: Ignore calls that occur too soon after the last execution
        if (now - lastExecutionTime < throttleInterval) {
          return params.nextCellPosition; // Return the intended next cell to continue navigation
        }

        lastExecutionTime = now; // Update the last execution time

        // Custom navigation logic
        const suggestedNextCell = params.nextCellPosition;
        if (suggestedNextCell) {
          // Clear focus from any cells with ag-cell-focus class
          const focusedCells = document.querySelectorAll('.ag-cell-focus');
          focusedCells.forEach(cell => {
            cell.classList.remove('ag-cell-focus');
          });

          // Ensure new cell is visible and set focus to it
          params.api.ensureColumnVisible(suggestedNextCell.column);
          params.api.ensureIndexVisible(suggestedNextCell.rowIndex);
          params.api.setFocusedCell(suggestedNextCell.rowIndex, suggestedNextCell.column);
        }

        // Return the next position to allow the navigation to occur
        return suggestedNextCell;
      };
    })()




