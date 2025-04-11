///////////////////////
//////////////////////////////////






suppressKeyboardEvent: (() => {
      const lastKeydown = {};
      const throttleInterval = 100; // in milliseconds

      return function (params) {
        const key = params.event.key;
        const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

        if (!allowedKeys.includes(key)) return false;

        const now = Date.now();
        const last = lastKeydown[key] || 0;
        const timeSinceLast = now - last;

        if (timeSinceLast < throttleInterval) {
          return true; // suppress the event
        }

        lastKeydown[key] = now;
        return false; // allow the event
      };
    })(),
  },
