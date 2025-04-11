///////////////////////
//////////////////////////////////






const lastKeydown = {};
const throttleInterval = 100; // in milliseconds

const gridOptions = {
  columnDefs: [...],
  defaultColDef: {
    suppressKeyboardEvent: (params) => {
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
