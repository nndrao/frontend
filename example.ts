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


////////////////////////////////////////////////////////////////////

private setupKeyboardHandling(): void {
  let arrowKeyHeld = false;
  let tabKeyHeld = false;
  let keyHoldTimer: any = null;
  let lastKey: string | null = null;
  let keyRepeatCount = 0;
  const MAX_REPEAT = 10;

  let isShiftPressed = false;

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;

    // Track shift
    if (key === 'Shift') {
      isShiftPressed = true;
      return;
    }

    const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
    const isTab = key === 'Tab';

    if (!isArrow && !isTab) return;

    // Don’t interfere with range selection or tabbing while editing
    const editingCell = this.gridApi.getEditingCells().length > 0;
    if (editingCell) return;

    if (isShiftPressed && isArrow) return;

    // Shared behavior for Arrow or Tab
    if (key === lastKey) {
      keyRepeatCount++;

      if (keyRepeatCount > MAX_REPEAT && this.gridApi.getDisplayedRowCount() > 1000) {
        event.preventDefault();

        const handleStep = () => {
          const focusedCell = this.gridApi.getFocusedCell();
          if (!focusedCell) return;

          let nextRow = focusedCell.rowIndex;
          let nextCol = focusedCell.column;

          const allCols = this.gridApi.getAllDisplayedColumns();
          const currentIdx = allCols.indexOf(nextCol);

          if (isArrow) {
            if (key === 'ArrowDown') nextRow++;
            else if (key === 'ArrowUp') nextRow--;
            else if (key === 'ArrowRight') nextCol = allCols[currentIdx + 1] || nextCol;
            else if (key === 'ArrowLeft') nextCol = allCols[currentIdx - 1] || nextCol;
          } else if (isTab) {
            nextCol = isShiftPressed
              ? allCols[currentIdx - 1] || nextCol
              : allCols[currentIdx + 1] || nextCol;

            // Optional: move to next row if at end
            if (!nextCol) {
              nextRow = isShiftPressed ? nextRow - 1 : nextRow + 1;
              nextCol = isShiftPressed
                ? allCols[allCols.length - 1]
                : allCols[0];
            }
          }

          if (
            nextRow >= 0 &&
            nextRow < this.gridApi.getDisplayedRowCount() &&
            nextCol
          ) {
            this.gridApi.ensureIndexVisible(nextRow);
            this.gridApi.ensureColumnVisible(nextCol);
            this.gridApi.setFocusedCell(nextRow, nextCol);
          }
        };

        if (!arrowKeyHeld && !tabKeyHeld) {
          if (isArrow) arrowKeyHeld = true;
          if (isTab) tabKeyHeld = true;

          keyHoldTimer = setInterval(handleStep, 150);
        }
      }
    } else {
      lastKey = key;
      keyRepeatCount = 0;
    }
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    const key = event.key;

    if (key === 'Shift') {
      isShiftPressed = false;
      return;
    }

    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)
    ) {
      arrowKeyHeld = false;
      tabKeyHeld = false;
      lastKey = null;
      keyRepeatCount = 0;

      if (keyHoldTimer) {
        clearInterval(keyHoldTimer);
        keyHoldTimer = null;
      }
    }
  });
}




//////////version 2

private setupKeyboardHandling(): void {
  let lastKey: string | null = null;
  let keyRepeatCount = 0;
  const MAX_REPEAT = 10;

  let isShiftPressed = false;
  let isArrowHeld = false;
  let isTabHeld = false;
  let rafId: number | null = null;

  const step = (key: string) => {
    const focusedCell = this.gridApi.getFocusedCell();
    if (!focusedCell) return;

    let nextRow = focusedCell.rowIndex;
    let nextCol = focusedCell.column;
    const allCols = this.gridApi.getAllDisplayedColumns();
    const currentIdx = allCols.indexOf(nextCol);

    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      if (key === 'ArrowDown') nextRow++;
      else if (key === 'ArrowUp') nextRow--;
      else if (key === 'ArrowRight') nextCol = allCols[currentIdx + 1] || nextCol;
      else if (key === 'ArrowLeft') nextCol = allCols[currentIdx - 1] || nextCol;
    }

    if (key === 'Tab') {
      nextCol = isShiftPressed
        ? allCols[currentIdx - 1] || nextCol
        : allCols[currentIdx + 1] || nextCol;

      // Optional row switch at edge
      if (!nextCol) {
        nextRow = isShiftPressed ? nextRow - 1 : nextRow + 1;
        nextCol = isShiftPressed
          ? allCols[allCols.length - 1]
          : allCols[0];
      }
    }

    if (
      nextRow >= 0 &&
      nextRow < this.gridApi.getDisplayedRowCount() &&
      nextCol
    ) {
      this.gridApi.ensureIndexVisible(nextRow);
      this.gridApi.ensureColumnVisible(nextCol);
      this.gridApi.setFocusedCell(nextRow, nextCol);
    }
  };

  const loop = () => {
    if (lastKey) step(lastKey);
    rafId = requestAnimationFrame(loop);
  };

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;

    if (key === 'Shift') {
      isShiftPressed = true;
      return;
    }

    const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
    const isTab = key === 'Tab';
    if (!isArrow && !isTab) return;

    // Don't interfere with editing or range selection
    if (this.gridApi.getEditingCells().length > 0) return;
    if (isArrow && isShiftPressed) return;

    if (key === lastKey) {
      keyRepeatCount++;
      if (keyRepeatCount > MAX_REPEAT && this.gridApi.getDisplayedRowCount() > 1000) {
        event.preventDefault();

        if (!rafId) {
          if (isArrow) isArrowHeld = true;
          if (isTab) isTabHeld = true;
          rafId = requestAnimationFrame(loop);
        }
      }
    } else {
      lastKey = key;
      keyRepeatCount = 0;
    }
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    const key = event.key;

    if (key === 'Shift') {
      isShiftPressed = false;
      return;
    }

    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)
    ) {
      isArrowHeld = false;
      isTabHeld = false;
      lastKey = null;
      keyRepeatCount = 0;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  });
}



///////////////version final1

private setupKeyboardHandling(): void {
  let lastKey: string | null = null;
  let keyRepeatCount = 0;
  const MAX_REPEAT = 10;

  let isShiftPressed = false;
  let isArrowHeld = false;
  let isTabHeld = false;
  let rafId: number | null = null;

  const step = (key: string) => {
    const focusedCell = this.gridApi.getFocusedCell();
    if (!focusedCell) return;

    let nextRow = focusedCell.rowIndex;
    let nextCol = focusedCell.column;
    const allCols = this.gridApi.getAllDisplayedColumns();
    const currentIdx = allCols.indexOf(nextCol);

    // Arrow key navigation
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      if (key === 'ArrowDown') nextRow++;
      else if (key === 'ArrowUp') nextRow--;
      else if (key === 'ArrowRight') nextCol = allCols[currentIdx + 1] || nextCol;
      else if (key === 'ArrowLeft') nextCol = allCols[currentIdx - 1] || nextCol;
    }

    // Tab key navigation (forward/backward with Shift)
    if (key === 'Tab') {
      nextCol = isShiftPressed
        ? allCols[currentIdx - 1] || nextCol
        : allCols[currentIdx + 1] || nextCol;

      // Move to previous/next row if at the start/end of row
      if (!nextCol) {
        nextRow = isShiftPressed ? nextRow - 1 : nextRow + 1;
        nextCol = isShiftPressed
          ? allCols[allCols.length - 1]
          : allCols[0];
      }
    }

    // Ensure valid bounds
    if (
      nextRow >= 0 &&
      nextRow < this.gridApi.getDisplayedRowCount() &&
      nextCol
    ) {
      // ✅ Clear any existing selection or ghost highlight
      this.gridApi.clearRangeSelection();

      // ✅ Set new focus
      this.gridApi.setFocusedCell(nextRow, nextCol);

      // Ensure visibility
      this.gridApi.ensureIndexVisible(nextRow);
      this.gridApi.ensureColumnVisible(nextCol);
    }
  };

  const loop = () => {
    if (lastKey) step(lastKey);
    rafId = requestAnimationFrame(loop);
  };

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;

    // Track Shift key state
    if (key === 'Shift') {
      isShiftPressed = true;
      return;
    }

    const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
    const isTab = key === 'Tab';
    if (!isArrow && !isTab) return;

    // Don't interfere if editing or range selection is active
    if (this.gridApi.getEditingCells().length > 0) return;
    if (isArrow && isShiftPressed) return;

    // Repeated key logic
    if (key === lastKey) {
      keyRepeatCount++;

      if (
        keyRepeatCount > MAX_REPEAT &&
        this.gridApi.getDisplayedRowCount() > 1000
      ) {
        event.preventDefault();

        if (!rafId) {
          if (isArrow) isArrowHeld = true;
          if (isTab) isTabHeld = true;

          rafId = requestAnimationFrame(loop);
        }
      }
    } else {
      lastKey = key;
      keyRepeatCount = 0;
    }
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    const key = event.key;

    if (key === 'Shift') {
      isShiftPressed = false;
      return;
    }

    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)
    ) {
      isArrowHeld = false;
      isTabHeld = false;
      lastKey = null;
      keyRepeatCount = 0;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  });
}



//////////////////////////////////////////Final -2

private setupKeyboardHandling(): void {
  let isShiftPressed = false;
  let lastKey: string | null = null;
  let lastNavTime = 0;
  const THROTTLE_INTERVAL = 150; // ms cooldown between steps

  const handleStep = (key: string) => {
    const now = performance.now();
    if (now - lastNavTime < THROTTLE_INTERVAL) return; // throttle

    const focusedCell = this.gridApi.getFocusedCell();
    if (!focusedCell) return;

    let nextRow = focusedCell.rowIndex;
    let nextCol = focusedCell.column;
    const allCols = this.gridApi.getAllDisplayedColumns();
    const currentIdx = allCols.indexOf(nextCol);

    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      if (key === 'ArrowDown') nextRow++;
      else if (key === 'ArrowUp') nextRow--;
      else if (key === 'ArrowRight') nextCol = allCols[currentIdx + 1] || nextCol;
      else if (key === 'ArrowLeft') nextCol = allCols[currentIdx - 1] || nextCol;
    }

    if (key === 'Tab') {
      nextCol = isShiftPressed
        ? allCols[currentIdx - 1] || nextCol
        : allCols[currentIdx + 1] || nextCol;

      if (!nextCol) {
        nextRow = isShiftPressed ? nextRow - 1 : nextRow + 1;
        nextCol = isShiftPressed
          ? allCols[allCols.length - 1]
          : allCols[0];
      }
    }

    if (
      nextRow >= 0 &&
      nextRow < this.gridApi.getDisplayedRowCount() &&
      nextCol &&
      (nextRow !== focusedCell.rowIndex || nextCol !== focusedCell.column)
    ) {
      // ✅ Only change focus if next is different
      this.gridApi.clearRangeSelection();
      this.gridApi.setFocusedCell(nextRow, nextCol);
      this.gridApi.ensureIndexVisible(nextRow);
      this.gridApi.ensureColumnVisible(nextCol);

      lastNavTime = now;
    }
  };

  // Shift key state tracking
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;
    if (key === 'Shift') {
      isShiftPressed = true;
      return;
    }

    const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
    const isTab = key === 'Tab';

    if (!isArrow && !isTab) return;

    if (this.gridApi.getEditingCells().length > 0) return;
    if (isArrow && isShiftPressed) return;

    // Prevent default tab/arrow behavior to take over focus
    event.preventDefault();

    requestAnimationFrame(() => handleStep(key));

    lastKey = key;
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      isShiftPressed = false;
    }
  });
}







this.setupKeyboardHandling();
