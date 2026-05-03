"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import NotificationBell from "@/components/figus/NotificationBell";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  async function handleLogout() {
    await signOut(auth);
    router.push("/figus");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0D1B2A] shadow-lg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <Link href="/figus" className="flex min-w-0 items-center gap-2">
          <Image
            src="/brand/alguien-tiene-logo.jpeg"
            alt="Alguien Tiene"
            width={260}
            height={120}
            className="h-14 w-auto shrink-0 rounded-xl object-contain sm:h-16"
            priority
          />
        </Link>

        <div className="flex flex-1 justify-center">
          <Link
            href="/figus"
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition sm:px-5 sm:py-2.5 ${
              pathname === "/figus"
                ? "bg-[#22C55E] text-white shadow-sm"
                : "text-white hover:bg-white/10"
            }`}
          >
            Figus 2026
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {loading ? (
            <span className="text-xs font-bold text-slate-300 sm:text-sm">Cargando...</span>
          ) : user ? (
            <>
              <NotificationBell />
              {user.email?.toLowerCase() === "francogonzalozapata@gmail.com" && (
                <Link
                  href="/admin"
                  className="hidden rounded-full border border-red-300/30 bg-red-500/15 px-3 py-2 text-sm font-black text-red-100 hover:bg-red-500/25 sm:inline-flex"
                >
                  Admin
                </Link>
              )}

              <Link
                href="/figus/suscripcion"
                className="rounded-full border border-emerald-300/30 bg-[#22C55E] px-3 py-2 text-xs font-black text-white hover:bg-[#16A34A] sm:text-sm"
              >
                Suscribite $
              </Link>

              <Link
                href="/perfil"
                className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-500/25 sm:text-sm"
              >
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="hidden rounded-full border border-white/20 bg-white px-3 py-2 text-sm font-black text-[#0D1B2A] hover:bg-slate-100 sm:inline-flex"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="max-w-[150px] sm:max-w-none">
              <GoogleLoginButton compact />
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
