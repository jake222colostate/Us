if (typeof global !== 'undefined') {
  try {
    const globalAny = global as any;
    const prev = globalAny.ErrorUtils?.getGlobalHandler?.();
    globalAny.ErrorUtils?.setGlobalHandler?.((e: any, isFatal: boolean) => {
      // Print the full error to native console
      console.log('[GLOBAL ERROR]', { isFatal, name: e?.name, message: e?.message, stack: e?.stack });
      prev && prev(e, isFatal);
    });
  } catch {}
}
