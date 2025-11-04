import "react-native-gesture-handler";
import "react-native-reanimated";
import './src/setup-global-error-logger';
import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);
