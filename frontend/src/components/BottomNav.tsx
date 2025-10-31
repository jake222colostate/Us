import { NavLink } from 'react-router-dom';

import { bottomNavRoutes } from '../navigation/routes';

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {bottomNavRoutes.map(({ path, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}
        >
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
