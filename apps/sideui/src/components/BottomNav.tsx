import { NavLink } from "react-router-dom";

import "./BottomNav.css";

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M3.75 9.75 12 3l8.25 6.75V20a1 1 0 0 1-1 1h-4.5a1 1 0 0 1-1-1v-4.75h-3.5V20a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    to: "/feed",
    label: "Feed",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="m12 5.1 1.6 3.24 3.58.52-2.59 2.53.61 3.56L12 13.59l-3.2 1.69.61-3.56L6.82 8.86l3.58-.52z" />
      </svg>
    ),
  },
  {
    to: "/likes",
    label: "Likes",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12.001 20.727c-.37 0-.739-.107-1.05-.32-3.873-2.702-6.3-4.915-7.645-7.234C2.032 11.7 1.5 9.978 1.5 8.278 1.5 5.248 3.934 3 6.766 3c1.56 0 3.153.788 4.235 2.036C12.087 3.788 13.68 3 15.24 3c2.832 0 5.266 2.248 5.266 5.278 0 1.7-.531 3.423-1.806 4.895-1.345 2.319-3.772 4.532-7.645 7.234-.311.213-.68.32-1.05.32z" />
      </svg>
    ),
  },
  {
    to: "/matches",
    label: "Matches",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M7.75 2A4.75 4.75 0 0 1 12 6.75c0 1.39-.63 2.64-1.63 3.47a9.78 9.78 0 0 0-1.04 1.01.75.75 0 0 1-1.06 0 9.78 9.78 0 0 0-1.04-1C6.63 9.39 6 8.14 6 6.75A4.75 4.75 0 0 1 10.25 2zm8 8A4.75 4.75 0 0 0 11 14.75c0 1.39.63 2.64 1.63 3.47.35.3.7.64 1.04 1.01a.75.75 0 0 0 1.06 0c.34-.37.69-.71 1.04-1.01a4.74 4.74 0 0 0 1.63-3.47A4.75 4.75 0 0 0 15.75 10z" />
      </svg>
    ),
  },
  {
    to: "/chat",
    label: "Chat",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3c5.084 0 9.2 3.356 9.2 7.5 0 4.143-4.116 7.5-9.2 7.5-.93 0-1.823-.115-2.663-.326l-3.5 2.152a.75.75 0 0 1-1.137-.648l.062-2.872C3.613 14.84 2.8 13.235 2.8 10.5 2.8 6.356 6.916 3 12 3z" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 12.75a4.5 4.5 0 1 0-4.5-4.5 4.5 4.5 0 0 0 4.5 4.5zm0 1.5c-3.472 0-7.5 1.765-7.5 4.5V21a.75.75 0 0 0 .75.75h13.5A.75.75 0 0 0 19.5 21v-2.25c0-2.735-4.028-4.5-7.5-4.5z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
          }
          end={item.to === "/"}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
