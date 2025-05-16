// grid-wrapper.ts
import { GridApi, CellPosition, CellRangeParams, CellFocusedEvent } from 'ag-grid-community';

/**
 * Configuration options for enhanced keyboard navigation
 */
export interface EnhancedNavigationConfig {
  /** Keys to enable for navigation and throttling */
  enabledKeys?: string[];
  /** Maximum number of events to allow per second */
  eventsPerSecond?: number;
  /** Initial delay before rapid keypresses start (ms) */
  initialDelay?: number;
  /** Initial interval between rapid keypresses (ms) */
  rapidInterval?: number;
  /** Rate at which interval decreases */
  accelerationRate?: number;
  /** Minimum interval between keypresses (ms) */
  minInterval?: number;
  /** Target element to attach the event listener to */
  targetElement?: HTMLElement | null;
}

/**
 * Static utility class for enhancing AG Grid functionality
 */
export class GridWrapper {
  // Default configuration
  private static DEFAULT_CONFIG: Required<EnhancedNavigationConfig> = {
    enabledKeys: [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
      'Tab', 'Home', 'End', 'PageUp', 'PageDown'
    ],
    eventsPerSecond: 8,
    initialDelay: 300,
    rapidInterval: 50,
    accelerationRate: 0.95,
    minInterval: 10,
    targetElement: null
  };

  // Store for active grids and their handlers
  private static activeGrids = new Map<GridApi, {
    keyDownHandler: (event: KeyboardEvent) => void;
    keyUpHandler: (event: KeyboardEvent) => void;
    focusedCellHandler: (params: CellFocusedEvent) => void;
    cleanup: () => void;
    keyStates: Map<string, {
      shiftKey: boolean;
      ctrlKey: boolean;
      altKey: boolean;
      metaKey?: boolean;
    }>;
    timers: Map<string, {
      initial: any;
      rapid: any;
      currentInterval: number;
    }>;
    lastProcessedTime: Record<string, number>;
    minTimeBetweenEvents: number;
  }>();

  /**
   * Enhance AG Grid with advanced keyboard navigation
   * @param gridApi The AG Grid API instance
   * @param config Optional configuration for navigation behavior
   * @returns A cleanup function to remove the enhancement
   */
  public static enhanceGridNavigation(gridApi: GridApi, config: EnhancedNavigationConfig = {}): () => void {
    // If this grid is already enhanced, clean up first
    if (GridWrapper.activeGrids.has(gridApi)) {
      GridWrapper.activeGrids.get(gridApi)?.cleanup();
    }

    const mergedConfig = { ...GridWrapper.DEFAULT_CONFIG, ...config };
    const targetElement = mergedConfig.targetElement || document.body;
    const minTimeBetweenEvents = Math.floor(1000 / mergedConfig.eventsPerSecond);
    
    // State storage
    const keyStates = new Map<string, { shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey?: boolean }>();
    const timers = new Map<string, { initial: any; rapid: any; currentInterval: number }>();
    const lastProcessedTime: Record<string, number> = {};

    // Helper functions
    const stopSimulation = (key: string) => {
      keyStates.delete(key);
      
      const timer = timers.get(key);
      if (timer) {
        if (timer.initial) {
          clearTimeout(timer.initial);
        }
        if (timer.rapid) {
          clearTimeout(timer.rapid);
        }
      }
      
      timers.delete(key);
    };

    const stopRapidSimulation = (key: string) => {
      const timer = timers.get(key);
      if (timer && timer.rapid) {
        clearTimeout(timer.rapid);
        timer.rapid = null;
      }
    };

    const simulateKeypress = (key: string, keyState: { shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey?: boolean }) => {
      if (!gridApi) return;
      
      const focusedCell = gridApi.getFocusedCell();
      
      try {
        switch (key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
            navigateInDirection(key, keyState.shiftKey, focusedCell);
            break;
          case 'Tab':
            navigateWithTab(!keyState.shiftKey, keyState.shiftKey, focusedCell);
            break;
          case 'Home':
            navigateToRowEdge(true, keyState.shiftKey);
            break;
          case 'End':
            navigateToRowEdge(false, keyState.shiftKey);
            break;
          case 'PageUp':
            navigateByPage(-1, keyState.shiftKey);
            break;
          case 'PageDown':
            navigateByPage(1, keyState.shiftKey);
            break;
        }
      } catch (error) {
        console.error('Error during keyboard navigation:', error);
      }
    };

    const startRapidSimulation = (key: string) => {
      if (!gridApi) return;
      
      stopRapidSimulation(key);
      
      const timer = timers.get(key);
      if (!timer) return;
      
      const simulate = () => {
        if (!keyStates.has(key)) {
          return; // Key was released
        }
        
        const keyState = keyStates.get(key);
        if (!keyState) return;
        
        // Simulate the keypress
        simulateKeypress(key, keyState);
        
        // Accelerate the interval
        timer.currentInterval = Math.max(
          timer.currentInterval * mergedConfig.accelerationRate,
          mergedConfig.minInterval
        );
        
        // Schedule the next simulation
        timer.rapid = setTimeout(simulate, timer.currentInterval);
      };
      
      // Start the first rapid simulation
      simulate();
    };

    // Navigation functions
    const navigateInDirection = (key: string, shiftKey: boolean, fromCell: CellPosition | null) => {
      if (!gridApi || !fromCell) return;
      
      const allColumns = gridApi.getAllGridColumns();
      if (!allColumns || allColumns.length === 0) return;
      
      const currentColIndex = allColumns.findIndex(col => col === fromCell.column);
      const totalRows = gridApi.getDisplayedRowCount();
      
      let newRowIndex = fromCell.rowIndex;
      let newColIndex = currentColIndex;
      
      // Calculate new position
      switch (key) {
        case 'ArrowUp':
          newRowIndex = Math.max(0, fromCell.rowIndex - 1);
          break;
        case 'ArrowDown':
          newRowIndex = Math.min(totalRows - 1, fromCell.rowIndex + 1);
          break;
        case 'ArrowLeft':
          newColIndex = Math.max(0, currentColIndex - 1);
          break;
        case 'ArrowRight':
          newColIndex = Math.min(allColumns.length - 1, currentColIndex + 1);
          break;
      }
      
      // Get the target column
      const targetColumn = allColumns[newColIndex];
      if (!targetColumn) return;
      
      // Only clear focus if not doing range selection
      if (!shiftKey) {
        gridApi.clearCellSelection();
      }
      
      // Ensure visibility for both vertical and horizontal navigation
      gridApi.ensureIndexVisible(newRowIndex);
      
      // Ensure column visibility for horizontal navigation
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        try {
          gridApi.ensureColumnVisible(targetColumn);
        } catch (err) {
          // Fallback to column ID-based approach if direct column reference fails
          if (targetColumn.getColId && typeof targetColumn.getColId === 'function') {
            gridApi.ensureColumnVisible(targetColumn.getColId());
          }
        }
      }
      
      // Set focus to the new cell
      gridApi.setFocusedCell(newRowIndex, targetColumn);
      
      // Force a refresh of the cells
      try {
        // Refresh specific rows
        const rowsToRefresh = [];
        if (fromCell.rowIndex !== newRowIndex) {
          const rowNode1 = gridApi.getRowNode(String(fromCell.rowIndex));
          const rowNode2 = gridApi.getRowNode(String(newRowIndex));
          if (rowNode1) rowsToRefresh.push(rowNode1);
          if (rowNode2) rowsToRefresh.push(rowNode2);
        }
        
        if (rowsToRefresh.length > 0) {
          gridApi.refreshCells({ rowNodes: rowsToRefresh });
        } else {
          // Refresh specific columns if only horizontal movement
          gridApi.refreshCells({ columns: [fromCell.column, targetColumn] });
        }
      } catch (err) {
        // Fallback to full grid refresh if specific refresh fails
        gridApi.refreshCells();
      }
      
      // Handle range selection
      if (shiftKey) {
        // Get existing ranges
        const existingRanges = gridApi.getCellRanges();
        let rangeStartCell = fromCell;
        
        // If we have existing ranges, use the start of the last range
        if (existingRanges && existingRanges.length > 0) {
          const lastRange = existingRanges[existingRanges.length - 1];
          const startRow = lastRange.startRow;
          if (startRow) {
            rangeStartCell = {
              rowIndex: startRow.rowIndex,
              column: lastRange.columns[0],
              rowPinned: startRow.rowPinned || null
            };
          }
        }
        
        // Don't clear existing ranges for continuous selection
        const rangeParams: CellRangeParams = {
          rowStartIndex: Math.min(rangeStartCell.rowIndex, newRowIndex),
          rowEndIndex: Math.max(rangeStartCell.rowIndex, newRowIndex),
          columnStart: rangeStartCell.column === targetColumn ? rangeStartCell.column : 
                        allColumns.indexOf(rangeStartCell.column) < allColumns.indexOf(targetColumn) ? 
                        rangeStartCell.column : targetColumn,
          columnEnd: rangeStartCell.column === targetColumn ? targetColumn : 
                      allColumns.indexOf(rangeStartCell.column) < allColumns.indexOf(targetColumn) ? 
                      targetColumn : rangeStartCell.column
        };
        
        gridApi.clearRangeSelection();
        gridApi.addCellRange(rangeParams);
      }
    };

    const navigateWithTab = (forward: boolean, shiftKey: boolean, fromCell: CellPosition | null) => {
      if (!gridApi || !fromCell) return;
      
      const allColumns = gridApi.getAllGridColumns();
      if (!allColumns || allColumns.length === 0) return;
      
      const currentColIndex = allColumns.findIndex(col => col === fromCell.column);
      const totalRows = gridApi.getDisplayedRowCount();
      
      let newRowIndex = fromCell.rowIndex;
      let newColIndex = currentColIndex;
      
      if (forward) {
        // Tab forward
        newColIndex++;
        if (newColIndex >= allColumns.length) {
          newColIndex = 0;
          newRowIndex++;
          if (newRowIndex >= totalRows) {
            newRowIndex = 0; // Wrap to top
          }
        }
      } else {
        // Tab backward (Shift+Tab)
        newColIndex--;
        if (newColIndex < 0) {
          newColIndex = allColumns.length - 1;
          newRowIndex--;
          if (newRowIndex < 0) {
            newRowIndex = totalRows - 1; // Wrap to bottom
          }
        }
      }
      
      const targetColumn = allColumns[newColIndex];
      if (!targetColumn) return;
      
      // Only clear focus if not doing range selection with Shift key
      if (!shiftKey || forward) {
        gridApi.clearCellSelection();
      }
      
      // Ensure the target row is visible
      gridApi.ensureIndexVisible(newRowIndex);
      
      // Ensure column visibility for Tab navigation
      try {
        gridApi.ensureColumnVisible(targetColumn);
      } catch (err) {
        // Fallback to column ID-based approach if direct column reference fails
        if (targetColumn.getColId && typeof targetColumn.getColId === 'function') {
          gridApi.ensureColumnVisible(targetColumn.getColId());
        }
      }
      
      // Set focus to the new cell
      gridApi.setFocusedCell(newRowIndex, targetColumn);
      
      // Force a refresh of the cells
      gridApi.refreshCells({ columns: [fromCell.column, targetColumn] });
      
      // Handle range selection for Shift+Tab
      if (shiftKey && !forward) {
        const existingRanges = gridApi.getCellRanges();
        let rangeStartCell = fromCell;
        
        if (existingRanges && existingRanges.length > 0) {
          const lastRange = existingRanges[existingRanges.length - 1];
          const startRow = lastRange.startRow;
          if (startRow) {
            rangeStartCell = {
              rowIndex: startRow.rowIndex,
              column: lastRange.columns[0],
              rowPinned: startRow.rowPinned || null
            };
          }
        }
        
        const rangeParams: CellRangeParams = {
          rowStartIndex: Math.min(rangeStartCell.rowIndex, newRowIndex),
          rowEndIndex: Math.max(rangeStartCell.rowIndex, newRowIndex),
          columnStart: rangeStartCell.column === targetColumn ? rangeStartCell.column : 
                        allColumns.indexOf(rangeStartCell.column) < allColumns.indexOf(targetColumn) ? 
                        rangeStartCell.column : targetColumn,
          columnEnd: rangeStartCell.column === targetColumn ? targetColumn : 
                      allColumns.indexOf(rangeStartCell.column) < allColumns.indexOf(targetColumn) ? 
                      targetColumn : rangeStartCell.column
        };
        
        gridApi.clearRangeSelection();
        gridApi.addCellRange(rangeParams);
      }
    };

    const navigateToRowEdge = (toStart: boolean, shiftKey: boolean) => {
      if (!gridApi) return;
      
      const focusedCell = gridApi.getFocusedCell();
      if (!focusedCell) return;
      
      const allColumns = gridApi.getAllGridColumns();
      if (!allColumns || allColumns.length === 0) return;
      
      const targetColumn = toStart ? allColumns[0] : allColumns[allColumns.length - 1];
      if (!targetColumn) return;
      
      // Store the current position for range selection
      let rangeStartCell = focusedCell;
      
      // If shift is held and we have existing ranges, use the start of the last range
      if (shiftKey) {
        const existingRanges = gridApi.getCellRanges();
        if (existingRanges && existingRanges.length > 0) {
          const lastRange = existingRanges[existingRanges.length - 1];
          const startRow = lastRange.startRow;
          if (startRow) {
            rangeStartCell = {
              rowIndex: startRow.rowIndex,
              column: lastRange.columns[0],
              rowPinned: startRow.rowPinned || null
            };
          }
        }
      }
      
      // Only clear focus if not doing range selection
      if (!shiftKey) {
        gridApi.clearCellSelection();
      }
      
      // Ensure column visibility when navigating to row edges
      try {
        gridApi.ensureColumnVisible(targetColumn);
      } catch (err) {
        // Fallback to column ID-based approach if direct column reference fails
        if (targetColumn.getColId && typeof targetColumn.getColId === 'function') {
          gridApi.ensureColumnVisible(targetColumn.getColId());
        }
      }
      
      // Navigate to the target cell
      gridApi.setFocusedCell(focusedCell.rowIndex, targetColumn);
      
      // Force a refresh of the cells to ensure focus is visually updated
      gridApi.refreshCells({
        columns: [focusedCell.column, targetColumn]
      });
      
      // Handle range selection
      if (shiftKey) {
        const rangeParams: CellRangeParams = {
          rowStartIndex: rangeStartCell.rowIndex,
          rowEndIndex: focusedCell.rowIndex,
          columnStart: toStart ? targetColumn : rangeStartCell.column,
          columnEnd: toStart ? rangeStartCell.column : targetColumn
        };
        
        gridApi.clearRangeSelection();
        gridApi.addCellRange(rangeParams);
      }
    };

    const navigateByPage = (direction: number, shiftKey: boolean) => {
      if (!gridApi) return;
      
      const focusedCell = gridApi.getFocusedCell();
      if (!focusedCell) return;
      
      // Store the current position for range selection
      let rangeStartCell = focusedCell;
      
      // If shift is held and we have existing ranges, use the start of the last range
      if (shiftKey) {
        const existingRanges = gridApi.getCellRanges();
        if (existingRanges && existingRanges.length > 0) {
          const lastRange = existingRanges[existingRanges.length - 1];
          const startRow = lastRange.startRow;
          if (startRow) {
            rangeStartCell = {
              rowIndex: startRow.rowIndex,
              column: lastRange.columns[0],
              rowPinned: startRow.rowPinned || null
            };
          }
        }
      }
      
      // Get page size from pagination or estimate from visible rows
      let pageSize = 50; // default
      
      if (gridApi.paginationIsLastPageFound()) {
        pageSize = gridApi.paginationGetPageSize();
      } else {
        // Estimate based on visible rows
        const visibleRows = gridApi.getDisplayedRowCount();
        pageSize = Math.max(10, Math.floor(visibleRows / 2));
      }
      
      const totalRows = gridApi.getDisplayedRowCount();
      const startIndex = Math.max(0, focusedCell.rowIndex + (direction * pageSize));
      const endIndex = Math.max(0, Math.min(startIndex, totalRows - 1));
      
      // Only clear focus if not doing range selection
      if (!shiftKey) {
        gridApi.clearCellSelection();
      }
      
      gridApi.ensureIndexVisible(endIndex);
      gridApi.setFocusedCell(endIndex, focusedCell.column);
      
      // Force a refresh of the cells
      gridApi.refreshCells();
      
      // Handle range selection
      if (shiftKey) {
        const rangeParams: CellRangeParams = {
          rowStartIndex: Math.min(rangeStartCell.rowIndex, endIndex),
          rowEndIndex: Math.max(rangeStartCell.rowIndex, endIndex),
          columnStart: rangeStartCell.column,
          columnEnd: focusedCell.column
        };
        
        gridApi.clearRangeSelection();
        gridApi.addCellRange(rangeParams);
      }
    };

    // Event handlers
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      
      // Check if this key should be handled
      if (!mergedConfig.enabledKeys.includes(key)) {
        return;
      }
      
      // Handle Shift+Arrow key combinations
      const effectiveKey = event.shiftKey &&
        (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight')
        ? `Shift+${key}`
        : key;
      
      const keyToTrack = mergedConfig.enabledKeys.includes(effectiveKey) ? effectiveKey : key;
      
      // First throttle the events
      const now = Date.now();
      const lastTime = lastProcessedTime[keyToTrack] || 0;
      
      // If not enough time has passed since the last event for this key, prevent default
      if (now - lastTime < minTimeBetweenEvents) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      // Update the last processed time for this key
      lastProcessedTime[keyToTrack] = now;
      
      // Prevent default to handle navigation ourselves
      event.preventDefault();
      event.stopPropagation();
      
      // If key is already being held, don't restart the simulation
      if (keyStates.has(key)) {
        return;
      }
      
      // Store key state
      const keyState = {
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      };
      
      keyStates.set(key, keyState);
      
      // Execute the first keypress immediately
      simulateKeypress(key, keyState);
      
      // Start the simulation after initial delay
      const initialTimer = setTimeout(() => {
        startRapidSimulation(key);
      }, mergedConfig.initialDelay);
      
      timers.set(key, {
        initial: initialTimer,
        rapid: null,
        currentInterval: mergedConfig.rapidInterval
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key;
      
      if (keyStates.has(key)) {
        stopSimulation(key);
      }
    };

    const onFocusedCellChanged = (params: CellFocusedEvent) => {
      if (!params.column) return;
      
      try {
        // Ensure the column is visible in the viewport
        gridApi.ensureColumnVisible(params.column);
      } catch (err) {
        console.error('Error handling focused cell change:', err);
      }
    };

    // Set up the event listeners
    targetElement.addEventListener('keydown', handleKeyDown, true);
    targetElement.addEventListener('keyup', handleKeyUp, true);
    gridApi.addEventListener('cellFocused', onFocusedCellChanged);

    // Create cleanup function
    const cleanup = () => {
      targetElement.removeEventListener('keydown', handleKeyDown, true);
      targetElement.removeEventListener('keyup', handleKeyUp, true);
      gridApi.removeEventListener('cellFocused', onFocusedCellChanged);
      
      // Clear all timers
      keyStates.forEach((_, key) => {
        stopSimulation(key);
      });
      
      // Remove from active grids
      GridWrapper.activeGrids.delete(gridApi);
    };

    // Store in active grids map
    GridWrapper.activeGrids.set(gridApi, {
      keyDownHandler: handleKeyDown,
      keyUpHandler: handleKeyUp,
      focusedCellHandler: onFocusedCellChanged,
      cleanup,
      keyStates,
      timers,
      lastProcessedTime,
      minTimeBetweenEvents
    });

    // Return cleanup function
    return cleanup;
  }

  /**
   * Disable navigation enhancement for a grid
   * @param gridApi The AG Grid API instance to disable navigation for
   */
  public static disableGridNavigation(gridApi: GridApi): void {
    if (GridWrapper.activeGrids.has(gridApi)) {
      GridWrapper.activeGrids.get(gridApi)?.cleanup();
      GridWrapper.activeGrids.delete(gridApi);
    }
  }
}
