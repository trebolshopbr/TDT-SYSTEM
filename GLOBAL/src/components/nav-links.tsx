"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  rol: string | null;
}

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

export default function NavLinks({ rol }: NavLinksProps) {
  const pathname = usePathname();

  const links: NavItem[] = [
    { href: "/", label: "Meu escritório", exact: true },
    { href: "/finanzas", label: "Financeiro" },
    { href: "/pedidos", label: "Pedidos" },
    { href: "/catalogo", label: "Catálogo" },
    { href: "/plataformas", label: "Plataformas" },
    { href: "/productos", label: "Produtos" },
  ];

  if (rol === "admin") {
    links.push({ href: "/admin/socios", label: "Sócios" });
  }

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-1 text-xs sm:text-sm scrollbar-none">
      {links.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition ${
              active
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:bg-neutral-900/60 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
