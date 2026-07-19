"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

/**
 * Cabecera global: navegación entre países y alternancia de tema.
 */
export default function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/chile", label: "Chile" },
    { href: "/colombia", label: "Colombia" },
    { href: "/peru", label: "Perú" },
  ];

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo">
          Heat<span>Schools</span>
        </Link>
        <nav>
          <ul className="nav-links">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={pathname === l.href ? "active" : ""}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label="Alternar tema claro/oscuro"
          >
            {theme === "light" ? "🌙 Oscuro" : "☀️ Claro"}
          </button>
        </div>
      </div>
    </header>
  );
}
