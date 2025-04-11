///////////////////////
//////////////////////////////////






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







