import { BrowserRouter, Route, Routes } from 'react-router-dom';

import BottomNav from '../components/BottomNav';
import { appRoutes } from '../navigation/routes';

export default function WebAppRouter() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          {appRoutes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
