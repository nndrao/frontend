///////////////////////
//////////////////////////////////







export function createThrottledNavigation({ arrowDelay = 30, tabDelay = 100 } = {}) {
  function suppressKeyboardEvent(params) {
    const key = params.event.key;
    return ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(key);
  }

  function navigateToNextCell(params) {
    const gridApi = params.api;
    const currentFocused = gridApi.getFocusedCell();
    const next = params.nextCellPosition;

    // Remove current cell focus immediately
    if (currentFocused) {
      const dom = document.querySelector(
        `.ag-cell[row-index="${currentFocused.rowIndex}"][col-id="${currentFocused.column.getColId()}"]`
      );
      dom?.blur(); // force blur to prevent dual focus
    }

    // Set focus to next cell with delay
    setTimeout(() => {
      if (next) {
        gridApi.ensureColumnVisible(next.column);
        gridApi.ensureIndexVisible(next.rowIndex);
        gridApi.setFocusedCell(next.rowIndex, next.column);
      }
    }, arrowDelay);

    return null; // suppress default behavior
  }

  function tabToNextCell(params) {
    const gridApi = params.api;
    const currentFocused = gridApi.getFocusedCell();
    const next = params.nextCellPosition;

    if (currentFocused) {
      const dom = document.querySelector(
        `.ag-cell[row-index="${currentFocused.rowIndex}"][col-id="${currentFocused.column.getColId()}"]`
      );
      dom?.blur();
    }

    setTimeout(() => {
      if (next) {
        gridApi.ensureColumnVisible(next.column);
        gridApi.ensureIndexVisible(next.rowIndex);
        gridApi.setFocusedCell(next.rowIndex, next.column);
      }
    }, tabDelay);

    return true; // prevent default tabbing
  }

  return {
    suppressKeyboardEvent,
    navigateToNextCell,
    tabToNextCell
  };
}
