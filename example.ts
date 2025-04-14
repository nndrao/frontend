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



/////////////////


private setupKeyboardHandling(): void {
  let arrowKeyHeld = false;
  let keyHoldTimer: any = null;
  let lastArrowKey: string | null = null;
  let keyRepeatCount = 0;
  const MAX_ARROW_REPEAT = 10;

  // 👇 Track Shift key state globally
  let isShiftPressed = false;

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;

    if (key === 'Shift') {
      isShiftPressed = true;
      return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }

    if (isShiftPressed) return; // Let AG Grid handle Shift+Arrow range selection

    if (key === lastArrowKey) {
      keyRepeatCount++;

      if (keyRepeatCount > MAX_ARROW_REPEAT &&
          this.gridApi.getDisplayedRowCount() > 1000) {

        event.preventDefault();

        if (!arrowKeyHeld) {
          arrowKeyHeld = true;

          keyHoldTimer = setInterval(() => {
            const focusedCell = this.gridApi.getFocusedCell();
            if (!focusedCell) return;

            let nextRow = focusedCell.rowIndex;
            let nextCol = focusedCell.column;

            const allCols = this.gridApi.getAllDisplayedColumns();
            const currentIdx = allCols.indexOf(nextCol);

            if (key === 'ArrowDown') nextRow++;
            else if (key === 'ArrowUp') nextRow--;
            else if (key === 'ArrowRight') nextCol = allCols[currentIdx + 1] || nextCol;
            else if (key === 'ArrowLeft') nextCol = allCols[currentIdx - 1] || nextCol;

            if (nextRow >= 0 && nextRow < this.gridApi.getDisplayedRowCount()) {
              this.gridApi.ensureIndexVisible(nextRow);
              this.gridApi.ensureColumnVisible(nextCol);
              this.gridApi.setFocusedCell(nextRow, nextCol);
            }
          }, 150);
        }
      }
    } else {
      lastArrowKey = key;
      keyRepeatCount = 0;
    }
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    const key = event.key;

    if (key === 'Shift') {
      isShiftPressed = false;
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      arrowKeyHeld = false;
      lastArrowKey = null;
      keyRepeatCount = 0;

      if (keyHoldTimer) {
        clearInterval(keyHoldTimer);
        keyHoldTimer = null;
      }
    }
  });
}





this.setupKeyboardHandling();
