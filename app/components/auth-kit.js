"use client";

import { useEffect, useState } from "react";

/* =========================================================
   CONFIG
   ========================================================= */

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.fades.lol"
).replace(/\/+$/, "");

export const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || "https://fades.lol";
export const DEVELOPER_URL =
  process.env.NEXT_PUBLIC_DEVELOPER_URL || "https://developer.fades.lol";

/* =========================================================
   API HELPERS
   ========================================================= */

export async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  return {
    status: response.status,
    ok: response.ok && data.success !== false,
    data,
  };
}

export function errorOf(result, fallback) {
  const value = result?.data?.error || result?.data?.message;
  return typeof value === "string" && value ? value : fallback;
}

// /auth/me may return the user directly or wrapped.
export function pickUser(data) {
  const user = data?.user || data?.account || data;
  if (!user || typeof user !== "object") return null;
  if (!(user.id || user.username || user.email)) return null;
  return user;
}

export function userLabel(user) {
  return user?.displayName || user?.username || user?.email || "Account";
}

export async function fetchSession() {
  const result = await request("/auth/me");
  return result.ok ? pickUser(result.data) : null;
}

/* =========================================================
   ICONS
   ========================================================= */

export function Icon({ name, size = 18 }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    warning: <><path d="M12 3 2.8 19h18.4z" /><path d="M12 9v4M12 16h.01" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    logout: <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M9 12h11" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h3" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.check}
    </svg>
  );
}

/* =========================================================
   LAYOUT PIECES
   ========================================================= */

export function Shell({ children, wide = false }) {
  return (
    <main className="fa-shell">
      <div className="fa-bg" aria-hidden="true">
        <div className="fa-glow fa-glow-one" />
        <div className="fa-glow fa-glow-two" />
        <div className="fa-grid" />
      </div>
      <div className={`fa-wrap ${wide ? "fa-wrap-wide" : ""}`}>
        {children}
        <footer className="fa-foot">
          <span>© {new Date().getFullYear()} Fades</span>
          <a href={MAIN_URL}>fades.lol</a>
          <a href={DEVELOPER_URL}>Developers</a>
        </footer>
      </div>
    </main>
  );
}

export function LogoMark({ size = 44 }) {
  return (
    <span className="fa-logo" style={{ width: size, height: size, flexBasis: size }}>
      <img
        src="/logo.png"
        alt=""
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <span className="fa-logo-letter" style={{ fontSize: size * 0.52 }}>F</span>
    </span>
  );
}

export function Brand() {
  return (
    <a className="fa-brand" href={MAIN_URL}>
      <LogoMark />
      <strong>fades<span>.</span></strong>
    </a>
  );
}

export function Avatar({ user, size = 40 }) {
  const [broken, setBroken] = useState(false);
  const initial = userLabel(user).trim().slice(0, 1).toUpperCase() || "F";

  return (
    <span className="fa-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {user?.avatar && !broken ? <img src={user.avatar} alt="" onError={() => setBroken(true)} /> : initial}
    </span>
  );
}

export function Spinner({ label }) {
  return (
    <div className="fa-splash" role="status">
      <span className="fa-spinner" /> {label}
    </div>
  );
}

/* =========================================================
   SIGN IN / CREATE ACCOUNT
   ========================================================= */

export function SignInPanel({ onAuthed, heading, subheading, notice }) {
  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(notice || "");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ identifier: "", username: "", email: "", password: "", confirm: "" });

  useEffect(() => { setInfo(notice || ""); }, [notice]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  function switchMode(next) {
    setMode(next);
    setError("");
    setInfo("");
    setShowPassword(false);
  }

  async function finish() {
    const user = await fetchSession();
    if (!user) {
      throw new Error("Signed in, but the session cookie wasn't accepted. The API must allow credentials from this site and share its cookie across fades.lol.");
    }
    onAuthed(user);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    let path;
    let body;

    if (mode === "signin") {
      const id = form.identifier.trim();
      if (!id || !form.password) return setError("Enter your username or email and your password.");
      path = "/auth/login";
      body = { username: id, identifier: id, ...(id.includes("@") ? { email: id } : {}), password: form.password };
    } else {
      const username = form.username.trim();
      const email = form.email.trim();
      if (username.length < 3) return setError("Choose a username with at least 3 characters.");
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
      if (form.password.length < 8) return setError("Use a password with at least 8 characters.");
      if (form.password !== form.confirm) return setError("Passwords don't match.");
      path = "/auth/signup";
      body = { username, email, password: form.password };
    }

    setBusy(true);

    try {
      const result = await request(path, { method: "POST", body });
      if (!result.ok) throw new Error(errorOf(result, mode === "signin" ? "Sign in failed." : "Couldn't create your account."));

      try {
        await finish();
      } catch (err) {
        if (mode === "signup") {
          switchMode("signin");
          setForm((current) => ({ ...current, identifier: body.username, password: "", confirm: "" }));
          setInfo("Account created. Sign in to continue.");
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="fa-card" aria-labelledby="fa-signin-title">
      <div className="fa-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")}>Sign in</button>
        <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Create account</button>
      </div>

      <h1 id="fa-signin-title" className="fa-title">
        {mode === "signin" ? heading || "Sign in to Fades" : "Create your Fades account"}
      </h1>
      <p className="fa-sub">
        {mode === "signin" ? subheading || "Use your Fades account to continue." : "One account for everything on Fades."}
      </p>

      {error && <div className="fa-alert fa-alert-error" role="alert"><Icon name="warning" size={16} /><span>{error}</span></div>}
      {info && !error && <div className="fa-alert fa-alert-ok" role="status"><Icon name="check" size={16} /><span>{info}</span></div>}

      <form className="fa-form" onSubmit={submit} noValidate>
        {mode === "signin" ? (
          <label>
            <span>Username or email</span>
            <input autoFocus autoComplete="username" value={form.identifier} onChange={set("identifier")} placeholder="you@example.com" />
          </label>
        ) : (
          <>
            <label>
              <span>Username</span>
              <input autoFocus autoComplete="username" value={form.username} onChange={set("username")} placeholder="yourname" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </label>
          </>
        )}

        <label>
          <span>Password</span>
          <div className="fa-password">
            <input type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={form.password} onChange={set("password")} placeholder={mode === "signin" ? "Your password" : "At least 8 characters"} />
            <button type="button" className="fa-icon-btn" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
              <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>
        </label>

        {mode === "signup" && (
          <label>
            <span>Confirm password</span>
            <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat your password" />
          </label>
        )}

        <button type="submit" className="fa-btn fa-btn-primary fa-btn-block" disabled={busy}>
          {busy ? <><span className="fa-spinner fa-spinner-sm" /> {mode === "signin" ? "Signing in…" : "Creating account…"}</> : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="fa-switch">
        {mode === "signin" ? "New to Fades?" : "Already have an account?"}{" "}
        <button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </section>
  );
}
