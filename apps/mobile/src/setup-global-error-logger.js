import { Platform } from 'react-native';

const defaultHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.log('[GLOBAL-ERR]', {
    name: error && error.name,
    message: error && error.message,
    stack: error && error.stack,
    isFatal,
    platform: Platform.OS,
  });
  if (defaultHandler) defaultHandler(error, isFatal);
});
