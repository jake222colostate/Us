import { defineConfig, ConfigContext, ExpoConfig } from 'expo/config';
import baseConfigDefault from './app.config.base';

const PROJECT_ID = '3ea68b38-55da-42b5-b8b3-605c9fdb9332';

function withEasProjectId(config: ExpoConfig): ExpoConfig {
  const currentExtra = config.extra ?? {};
  const currentEas = (currentExtra as any).eas ?? {};
  return {
    ...config,
    extra: {
      ...currentExtra,
      eas: {
        ...currentEas,
        projectId: PROJECT_ID,
      },
    },
  };
}

export default defineConfig((...args: Parameters<(config: ConfigContext) => ExpoConfig>) => {
  const base = typeof baseConfigDefault === 'function' ? baseConfigDefault(...args) : (baseConfigDefault as ExpoConfig);
  return withEasProjectId(base);
});
