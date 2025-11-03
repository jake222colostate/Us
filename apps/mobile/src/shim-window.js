if (typeof global.window === 'undefined') {
  global.window = {};
}

// no-op event listeners so web code doesn't crash
if (typeof global.window.addEventListener !== 'function') {
  global.window.addEventListener = () => {};
}
if (typeof global.window.removeEventListener !== 'function') {
  global.window.removeEventListener = () => {};
}

// fake history so router/web bits don't die
if (typeof global.window.history === 'undefined') {
  global.window.history = {
    pushState() {},
    replaceState() {},
    back() {},
    forward() {},
    state: {},
  };
}

// fake location enough for checks
if (typeof global.window.location === 'undefined') {
  global.window.location = {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
  };
}
