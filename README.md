 // throttledNavigation.js

export function createThrottledNavigation({ arrowDelay = 20, tabDelay = 100 } = {}) {
  function suppressKeyboardEvent(params) {
    const key = params.event.key;
    return ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(key);
  }

  function navigateToNextCell(params) {
    const suggestedNextCell = params.nextCellPosition;

    setTimeout(() => {
      if (suggestedNextCell) {
        params.api.ensureColumnVisible(suggestedNextCell.column);
        params.api.ensureIndexVisible(suggestedNextCell.rowIndex);
        params.api.setFocusedCell(suggestedNextCell.rowIndex, suggestedNextCell.column);
      }
    }, arrowDelay);

    return null;
  }

  function tabToNextCell(params) {
    const suggestedNextCell = params.nextCellPosition;

    setTimeout(() => {
      if (suggestedNextCell) {
        params.api.ensureColumnVisible(suggestedNextCell.column);
        params.api.ensureIndexVisible(suggestedNextCell.rowIndex);
        params.api.setFocusedCell(suggestedNextCell.rowIndex, suggestedNextCell.column);
      }
    }, tabDelay);

    return true;
  }

  return {
    suppressKeyboardEvent,
    navigateToNextCell,
    tabToNextCell
  };
}



import { createThrottledNavigation } from './throttledNavigation';

const throttledNav = createThrottledNavigation({
  arrowDelay: 30,
  tabDelay: 100
});

const gridOptions = {
  columnDefs: [...],
  defaultColDef: {
    suppressKeyboardEvent: throttledNav.suppressKeyboardEvent
  },
  navigateToNextCell: throttledNav.navigateToNextCell,
  tabToNextCell: throttledNav.tabToNextCell,
};


