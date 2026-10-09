"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Avatar,
  Brand,
  Icon,
  Shell,
  SignInPanel,
  Spinner,
  errorOf,
  request,
  userLabel,
} from "../../components/auth-kit";
import { AppTile } from "../../components/app-tile";

/* What each scope means, in plain language. */
const SCOPE_COPY = {
  openid: { icon: "id", title: "Confirm who you are", detail: "Verify that you have a Fades account." },
  profile: { icon: "user", title: "See your profile", detail: "Your display name, username and profile picture." },
  email: { icon: "mail", title: "See your email address", detail: "Your email and whether it's verified." },
};

function friendlyError(code) {
  const text = String(code || "");
  if (/unknown app/i.test(text)) return "This app isn't registered with Fades.";
  if (/redirect/i.test(text)) return "This app's return address isn't registered, so Fades can't send you back safely.";
  if (text === "invalid_scope") return "This app asked for access Fades doesn't offer.";
  if (text === "unsupported_response_type") return "This app is using an unsupported sign-in method.";
  if (text === "invalid_request") return "This app sent an incomplete request. It must use PKCE (S256) and a valid code challenge.";
  if (text && text.includes(" ")) return text;
  return "This sign-in request couldn't be completed.";
}

function hostOf(uri) {
  try {
    return new URL(uri).host;
  } catch {
    return "the app";
  }
}

function ConsentFlow() {
  const search = useSearchParams();
  const params = useMemo(() => Object.fromEntries(search.entries()), [search]);

  // loading | signin | ready | unverified | error | redirecting
  const [view, setView] = useState("loading");
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setView("loading");
    setMessage("");

    if (!params.client_id || !params.redirect_uri) {
      setMessage("This sign-in link is missing details. Go back to the app and try again.");
      return setView("error");
    }

    try {
      const result = await request("/oauth/authorize/info", { method: "POST", body: params });

      if (result.status === 401) return setView("signin");

      if (!result.ok) {
        const code = errorOf(result, "");
        if (/verif/i.test(code)) return setView("unverified");
        setMessage(friendlyError(code));
        return setView("error");
      }

      setInfo(result.data);
      setView("ready");
    } catch {
      setMessage("Can't reach Fades right now. Check your connection and try again.");
      setView("error");
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(approve) {
    setBusy(approve ? "allow" : "deny");
    setMessage("");

    try {
      const result = await request("/oauth/authorize/decision", {
        method: "POST",
        body: { ...params, approve },
      });

      if (result.status === 401) return setView("signin");

      if (!result.ok || !result.data.redirectTo) {
        const code = errorOf(result, "");
        if (/verif/i.test(code)) return setView("unverified");
        setMessage(friendlyError(code));
        return setView("error");
      }

      setView("redirecting");
      window.location.assign(result.data.redirectTo);
    } catch {
      setMessage("Couldn't reach Fades. Try again.");
      setBusy("");
    }
  }

  async function switchAccount() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* continue to sign-in either way */
    }
    setInfo(null);
    setView("signin");
  }

  const appName = info?.app?.name || "This app";
  const scopes = info?.scopes || [];
  const user = info?.user;

  if (view === "loading") return <Spinner label="Checking this request…" />;
  if (view === "redirecting") return <Spinner label="Taking you back to the app…" />;

  if (view === "signin") {
    return (
      <>
        <Brand />
        <SignInPanel
          heading="Sign in to continue"
          subheading="An app is asking to use your Fades account. Sign in to review the request."
          onAuthed={load}
        />
      </>
    );
  }

  if (view === "unverified") {
    return (
      <>
        <Brand />
        <section className="fa-card fa-center">
          <div className="fa-badge fa-badge-warn"><Icon name="mail" size={24} /></div>
          <h1 className="fa-title">Verify your email first</h1>
          <p className="fa-sub">
            {appName === "This app" ? "Apps" : appName} can only use Fades accounts with a verified email address. Check your inbox for the verification link, then try again.
          </p>
          <div className="fa-actions">
            <button className="fa-btn fa-btn-ghost" onClick={switchAccount}>Use another account</button>
            <button className="fa-btn fa-btn-primary" onClick={load}>I've verified it</button>
          </div>
        </section>
      </>
    );
  }

  if (view === "error") {
    return (
      <>
        <Brand />
        <section className="fa-card fa-center">
          <div className="fa-badge fa-badge-bad"><Icon name="warning" size={24} /></div>
          <h1 className="fa-title">We couldn't continue</h1>
          <p className="fa-sub">{message}</p>
          <div className="fa-actions">
            <button className="fa-btn fa-btn-ghost" onClick={load}>Try again</button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Brand />
      <section className="fa-card" aria-labelledby="fa-consent-title">
        <div className="fa-link-row" aria-hidden="true">
          <AppTile name={appName} src={info?.app?.iconUrl} />
          <span className="fa-link-line" />
          <Avatar user={user} size={52} />
        </div>

        <h1 id="fa-consent-title" className="fa-title fa-title-center">
          {appName} wants to use your Fades account
        </h1>

        <div className="fa-account">
          <Avatar user={user} size={38} />
          <span className="fa-account-copy">
            <strong>{userLabel(user)}</strong>
            <small>{user?.email || (user?.username ? `@${user.username}` : "")}</small>
          </span>
          <button type="button" className="fa-link-btn" onClick={switchAccount}>Not you?</button>
        </div>

        <div className="fa-perms">
          <p className="fa-perms-label">{appName} will be able to</p>
          <ul>
            {scopes.map((scope) => {
              const copy = SCOPE_COPY[scope] || { icon: "shield", title: scope, detail: "" };
              return (
                <li key={scope}>
                  <span className="fa-perm-icon"><Icon name={copy.icon} size={16} /></span>
                  <span>
                    <strong>{copy.title}</strong>
                    {copy.detail && <small>{copy.detail}</small>}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="fa-perms-note">It won't see your password or be able to act as you.</p>
        </div>

        {message && <div className="fa-alert fa-alert-error" role="alert"><Icon name="warning" size={16} /><span>{message}</span></div>}

        <div className="fa-actions fa-actions-split">
          <button className="fa-btn fa-btn-ghost" onClick={() => decide(false)} disabled={Boolean(busy)}>
            {busy === "deny" ? <span className="fa-spinner fa-spinner-sm" /> : "Cancel"}
          </button>
          <button className="fa-btn fa-btn-primary" onClick={() => decide(true)} disabled={Boolean(busy)}>
            {busy === "allow" ? <><span className="fa-spinner fa-spinner-sm" /> Allowing…</> : "Allow access"}
          </button>
        </div>

        <p className="fa-fine">
          <Icon name="lock" size={13} /> You'll be sent to <strong>{hostOf(params.redirect_uri)}</strong>. You can remove this app's access any time from your Fades account.
        </p>
      </section>
    </>
  );
}

export default function ConsentPage() {
  return (
    <Shell>
      <Suspense fallback={<Spinner label="Loading…" />}>
        <ConsentFlow />
      </Suspense>
    </Shell>
  );
}
