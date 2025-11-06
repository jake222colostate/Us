if (typeof global !== 'undefined') {
  try {
    const prev = global.ErrorUtils?.getGlobalHandler?.();
    global.ErrorUtils?.setGlobalHandler?.((e, isFatal) => {
      // Print the full error to native console
      console.log('[GLOBAL ERROR]', { isFatal, name: e?.name, message: e?.message, stack: e?.stack });
      prev && prev(e, isFatal);
    });
  } catch {}
}
