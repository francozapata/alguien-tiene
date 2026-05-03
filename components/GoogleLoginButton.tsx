"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

type GoogleLoginButtonProps = {
  compact?: boolean;
};

export default function GoogleLoginButton({ compact = false }: GoogleLoginButtonProps) {
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setMessage("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setMessage("No se pudo iniciar sesión con Google.");
    }
  };

  return (
    <div className={compact ? "max-w-xs" : "mx-auto max-w-md"}>
      <button
        onClick={handleLogin}
        className={`rounded-full bg-[#22C55E] font-black text-white shadow-sm transition hover:bg-[#16A34A] ${compact ? "px-3 py-2 text-sm" : "px-5 py-3"}`}
      >
        Ingresar con Google
      </button>

      {message ? <p className="mt-2 text-xs font-semibold text-red-600">{message}</p> : null}
    </div>
  );
}
