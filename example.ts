

function throttle(fn: (e: KeyboardEvent) => void, delay: number): (e: KeyboardEvent) => void {
  let lastCall = 0;
  return (e: KeyboardEvent) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(e);
    } else {
      e.preventDefault(); // suppress key event if throttled
    }
  };
}





import { GridReadyEvent } from 'ag-grid-community';

function onGridReady(params: GridReadyEvent): void {
  const gridDiv = document.querySelector<HTMLElement>('.ag-root');

  if (gridDiv) {
    const throttledKeyHandler = throttle((e: KeyboardEvent) => {
      // Do nothing, just throttle the event
      // ag-Grid will handle focus/navigation as usual
    }, 100); // ← Adjust throttle interval here

    gridDiv.addEventListener('keydown', throttledKeyHandler);

    // Optional cleanup on destroy
    params.api.addEventListener('gridDestroyed', () => {
      gridDiv.removeEventListener('keydown', throttledKeyHandler);
    });
  }
}
