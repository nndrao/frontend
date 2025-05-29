

Hi David,

We’re encountering multiple peer dependency issues in the package.json file during our migration from Gradle to the NPM buildpack. As a temporary workaround, we’ve been using the npm install --force command to bypass these issues.

While we plan to properly resolve the dependencies during our upgrade to a newer version of Angular, we would really appreciate it if you could enable the --force option for npm install in our build pipeline.

This change is crucial for us to meet a tight deadline to migrate our codebase in the development environment to OPC by May 31st.

Thanks for your support.

Best regards,
Anand Rao















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







