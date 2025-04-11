///////////////////////
//////////////////////////////////






import { GridOptions, SuppressKeyboardEventParams } from 'ag-grid-community';

const lastKeydown: Record<string, number> = {};
const throttleInterval = 100; // ms

const gridOptions: GridOptions = {
  columnDefs: [...],
  defaultColDef: {
    suppressKeyboardEvent: (params: SuppressKeyboardEventParams): boolean => {
      const key = params.event.key;
      const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

      if (!allowedKeys.includes(key)) return false;

      const now = Date.now();
      const last = lastKeydown[key] || 0;
      const timeSinceLast = now - last;

      if (timeSinceLast < throttleInterval) {
        return true; // Suppress this key event
      }

      lastKeydown[key] = now;
      return false; // Allow the event
    },
  },
};
