import React, { useState, useEffect } from "react";
import System from "../../../models/system";
import SingleUserAuth from "./SingleUserAuth";
import MultiUserAuth from "./MultiUserAuth";
import {
  AUTH_TOKEN,
  AUTH_USER,
  AUTH_TIMESTAMP,
} from "../../../utils/constants";
import useLogo from "../../../hooks/useLogo";

export default function PasswordModal({ mode = "single" }) {
  const { loginLogo, isCustomLogo } = useLogo();
  return (
    <div className="fixed inset-0 bg-login-gradient light:bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
      {/* XSCALE ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 h-[640px] w-[640px] rounded-full blur-[120px] opacity-30 light:opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.55) 0%, rgba(20,184,166,0.25) 45%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <img
          src={loginLogo}
          alt="XSCALE AI"
          className={`max-h-[80px] ${isCustomLogo ? "rounded-lg" : ""}`}
          style={{ objectFit: "contain" }}
        />
        <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-theme-bg-secondary/80 light:bg-white/90 backdrop-blur-xl shadow-[0_24px_60px_-20px_rgba(6,182,212,0.35)]">
          {mode === "single" ? <SingleUserAuth /> : <MultiUserAuth />}
        </div>
      </div>
    </div>
  );
}

export function usePasswordModal(notry = false) {
  const [auth, setAuth] = useState({
    loading: true,
    requiresAuth: false,
    mode: "single",
  });

  useEffect(() => {
    async function checkAuthReq() {
      if (!window) return;

      // If the last validity check is still valid
      // we can skip the loading.
      if (!System.needsAuthCheck() && notry === false) {
        setAuth({
          loading: false,
          requiresAuth: false,
          mode: "multi",
        });
        return;
      }

      const settings = await System.keys();
      if (settings?.MultiUserMode) {
        const currentToken = window.localStorage.getItem(AUTH_TOKEN);
        if (!!currentToken) {
          const valid = notry ? false : await System.checkAuth(currentToken);
          if (!valid) {
            setAuth({
              loading: false,
              requiresAuth: true,
              mode: "multi",
            });
            window.localStorage.removeItem(AUTH_USER);
            window.localStorage.removeItem(AUTH_TOKEN);
            window.localStorage.removeItem(AUTH_TIMESTAMP);
            return;
          } else {
            setAuth({
              loading: false,
              requiresAuth: false,
              mode: "multi",
            });
            return;
          }
        } else {
          setAuth({
            loading: false,
            requiresAuth: true,
            mode: "multi",
          });
          return;
        }
      } else {
        // Running token check in single user Auth mode.
        // If Single user Auth is disabled - skip check
        const requiresAuth = settings?.RequiresAuth || false;
        if (!requiresAuth) {
          setAuth({
            loading: false,
            requiresAuth: false,
            mode: "single",
          });
          return;
        }

        const currentToken = window.localStorage.getItem(AUTH_TOKEN);
        if (!!currentToken) {
          const valid = notry ? false : await System.checkAuth(currentToken);
          if (!valid) {
            setAuth({
              loading: false,
              requiresAuth: true,
              mode: "single",
            });
            window.localStorage.removeItem(AUTH_TOKEN);
            window.localStorage.removeItem(AUTH_USER);
            window.localStorage.removeItem(AUTH_TIMESTAMP);
            return;
          } else {
            setAuth({
              loading: false,
              requiresAuth: false,
              mode: "single",
            });
            return;
          }
        } else {
          setAuth({
            loading: false,
            requiresAuth: true,
            mode: "single",
          });
          return;
        }
      }
    }
    checkAuthReq();
  }, []);

  return auth;
}
