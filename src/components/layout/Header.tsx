import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo-shield.png";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/registration", label: "Registration" },
  { to: "/marathon", label: "Marathon" },
  { to: "/contact", label: "Contact" },
  { to: "/intercollege", label: "Intercollage Fest" },
  { to: "/bgmi", label: "BGMI" },
  { to: "/collaboration", label: "Collabration" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Mangalore Sports Meet logo" className="h-10 w-10 object-contain" width={40} height={40} />
          <span className="hidden font-display text-lg font-bold uppercase tracking-tight text-primary sm:inline">
            Manglore Sports Meet
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition-smooth hover:text-primary",
                  isActive ? "text-primary" : "text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-foreground"
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background lg:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition-smooth",
                  pathname === item.to ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
