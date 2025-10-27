import * as AppModule from './App';
// Use default if present, else named { App }
const RealApp = (AppModule as any).default ?? (AppModule as any).App;
export default RealApp;
