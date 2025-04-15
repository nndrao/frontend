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
//////////////////another version of of the above function












/**
 * Balanced navigation throttling for large AG Grids.
 * Optimized for responsiveness while preventing freezing on large datasets.
 * 
 * @param api - The AG Grid API instance
 * @returns A cleanup function to remove the event listener
 */
export function setupHighPerformanceNavThrottle(api: GridApi): () => void {
  // Define navigation keys as a Set for O(1) lookup performance
  const navKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
  
  // Find the grid root element
  const gridRoot = document.querySelector<HTMLElement>('.ag-root');
  if (!gridRoot) {
    console.warn('AG Grid root element not found');
    return () => {  // Add the event listener and prepare cleanup function
  gridRoot.addEventListener('keydown', handleKeyNavigation, true);
  
  // Return a cleanup function
  const cleanup = (): void => {
    gridRoot.removeEventListener('keydown', handleKeyNavigation, true);
  };
  
  // Also hook into grid destroyed event for automatic cleanup
  api.addEventListener('gridDestroyed', cleanup);
  
  return cleanup;
}; // Return no-op cleanup function
  }
  
  // Simple performance-focused configuration
  const THROTTLE_INTERVAL = 60; // Short interval for responsiveness
  
  // State tracking
  let lastEventTime = 0;
  let consecutiveEvents = 0;
  
  // Event handler with balanced throttling approach
  const handleKeyNavigation = (e: KeyboardEvent): void => {
    // Early return if not a navigation key
    if (!navKeys.has(e.key)) return;
    
    const currentTime = Date.now();
    const timeSinceLastEvent = currentTime - lastEventTime;
    
    // Count consecutive rapid keypresses
    if (timeSinceLastEvent < 150) {
      consecutiveEvents++;
    } else {
      consecutiveEvents = 0;
    }
    
    // Basic throttling - block events that happen too quickly
    if (timeSinceLastEvent < THROTTLE_INTERVAL) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // After multiple consecutive events, add a slight delay
    // but not so much that it feels unresponsive
    if (consecutiveEvents > 10) {
      // Brief additional delay to prevent freezing
      if (consecutiveEvents % 5 === 0) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
          // Dispatch a synthetic event to continue navigation after pause
          const syntheticEvent = new KeyboardEvent('keydown', {
            key: e.key,
            bubbles: true
          });
          document.activeElement?.dispatchEvent(syntheticEvent);
        }, 50);
        return;
      }
    }
    
    // Update timestamp and allow the event
    lastEventTime = currentTime;
  };
  
  // Add event listener with capture phase
  gridRoot.addEventListener('keydown', handleKeyNavigation, true);
  
  // Return cleanup function instead of relying on grid destruction event
  const cleanup = (): void => {
    gridRoot.removeEventListener('keydown', handleKeyNavigation, true);
  };
  
  // Also hook into grid destroyed event for automatic cleanup
  api.addEventListener('gridDestroyed', cleanup);
  
  // Return cleanup function for manual cleanup if needed
  return cleanup;
}
















////***********************************************************************/////////////

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


////////////////////////////////////////////////////////////////////////////////////////// Final 3 grow row skiping:

private setupKeyboardHandling(): void {
  let isShiftPressed = false;
  let lastKey: string | null = null;
  let lastNavTime = 0;
  const THROTTLE_INTERVAL = 150;

  const handleStep = (key: string) => {
    const now = performance.now();
    if (now - lastNavTime < THROTTLE_INTERVAL) return;

    const focusedCell = this.gridApi.getFocusedCell();
    if (!focusedCell) return;

    let nextRow = focusedCell.rowIndex;
    let nextCol = focusedCell.column;
    const allCols = this.gridApi.getAllDisplayedColumns();
    const currentIdx = allCols.indexOf(nextCol);

    // Determine next cell position
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

    // ✅ Skip group rows (they can't be focused)
    while (
      nextRow >= 0 &&
      nextRow < this.gridApi.getDisplayedRowCount() &&
      this.gridApi.getDisplayedRowAtIndex(nextRow)?.group
    ) {
      nextRow = key === 'ArrowUp' || (key === 'Tab' && isShiftPressed)
        ? nextRow - 1
        : nextRow + 1;
    }

    if (
      nextRow >= 0 &&
      nextRow < this.gridApi.getDisplayedRowCount() &&
      nextCol &&
      (nextRow !== focusedCell.rowIndex || nextCol !== focusedCell.column)
    ) {
      this.gridApi.clearRangeSelection(); // avoid double focus styles
      this.gridApi.setFocusedCell(nextRow, nextCol);
      this.gridApi.ensureIndexVisible(nextRow);
      this.gridApi.ensureColumnVisible(nextCol);
      lastNavTime = now;
    }
  };

  // Listen to key presses
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
    if (isArrow && isShiftPressed) return; // Let AG Grid handle Shift+Arrow for range selection

    // prevent native scroll/jump
    event.preventDefault();

    requestAnimationFrame(() => handleStep(key));
    lastKey = key;
  });

  // Track shift state
  document.addEventListener('keyup', (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      isShiftPressed = false;
    }
  });
}

//////////////////////////////////////////////////////// Final SetInterval version

private setupKeyboardHandling(): void {
  let arrowKeyHeld = false;
  let keyHoldTimer: any = null;
  let lastArrowKey: string | null = null;
  let keyRepeatCount = 0;
  const MAX_ARROW_REPEAT = 10;

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

    // ✅ Let AG Grid handle Shift+Arrow for range selection
    if (isShiftPressed) return;

    if (key === lastArrowKey) {
      keyRepeatCount++;

      if (
        keyRepeatCount > MAX_ARROW_REPEAT &&
        this.gridApi.getDisplayedRowCount() > 1000
      ) {
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

            // 🔁 Determine new position based on arrow key
            if (key === 'ArrowDown') nextRow++;
            else if (key === 'ArrowUp') nextRow--;
            else if (key === 'ArrowRight') nextCol = allCols[currentIdx + 1] || nextCol;
            else if (key === 'ArrowLeft') nextCol = allCols[currentIdx - 1] || nextCol;

            // ✅ Skip over group rows
            while (
              nextRow >= 0 &&
              nextRow < this.gridApi.getDisplayedRowCount() &&
              this.gridApi.getDisplayedRowAtIndex(nextRow)?.group
            ) {
              nextRow = key === 'ArrowUp' ? nextRow - 1 : nextRow + 1;
            }

            // ✅ Bound check and apply navigation
            if (
              nextRow >= 0 &&
              nextRow < this.gridApi.getDisplayedRowCount()
            ) {
              this.gridApi.clearRangeSelection();
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


///////////////////////////////////////////////////////////////////////Set Interval version 2
private setupKeyboardHandling(): void {
  let arrowKeyHeld = false;
  let keyHoldTimer: any = null;
  let lastArrowKey: string | null = null;
  let keyRepeatCount = 0;
  const MAX_ARROW_REPEAT = 10;

  let isShiftPressed = false;

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;

    if (key === 'Shift') {
      isShiftPressed = true;
      return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

    if (isShiftPressed) return; // Let AG Grid handle Shift+Arrow

    if (key === lastArrowKey) {
      keyRepeatCount++;

      if (
        keyRepeatCount > MAX_ARROW_REPEAT &&
        this.gridApi.getDisplayedRowCount() > 1000
      ) {
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

            // ✅ Find nearest non-group row
            while (
              nextRow >= 0 &&
              nextRow < this.gridApi.getDisplayedRowCount() &&
              this.gridApi.getDisplayedRowAtIndex(nextRow)?.group
            ) {
              nextRow = key === 'ArrowUp' ? nextRow - 1 : nextRow + 1;
            }

            // ❌ If out of bounds, stop loop — avoid infinite scrolling & freezing
            if (
              nextRow < 0 ||
              nextRow >= this.gridApi.getDisplayedRowCount()
            ) {
              clearInterval(keyHoldTimer);
              keyHoldTimer = null;
              arrowKeyHeld = false;
              return;
            }

            const currentFocus = this.gridApi.getFocusedCell();
            if (
              currentFocus &&
              currentFocus.rowIndex === nextRow &&
              currentFocus.column.getColId() === nextCol.getColId()
            ) {
              return; // Prevent refocusing the same cell
            }

            this.gridApi.clearRangeSelection();
            this.gridApi.ensureIndexVisible(nextRow);
            this.gridApi.ensureColumnVisible(nextCol);
            this.gridApi.setFocusedCell(nextRow, nextCol);
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
