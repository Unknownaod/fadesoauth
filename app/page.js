make this look closer too discords o2auth prompt

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Brand,
  DEVELOPER_URL,
  Icon,
  Shell,
  SignInPanel,
  Spinner,
  errorOf,
  fetchSession,
  request,
  userLabel,
} from "./components/auth-kit";

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

const SCOPE_LABEL = { openid: "Identity", profile: "Profile", email: "Email" };

function AccountView({ user, onSignedOut, onExpired }) {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request("/oauth/grants");
      if (result.status === 401) return onExpired();
      if (!result.ok) throw new Error(errorOf(result, "Couldn't load your connected apps."));
      setGrants(Array.isArray(result.data.apps) ? result.data.apps : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onExpired]);

  useEffect(() => { load(); }, [load]);

  async function disconnect(clientId) {
    setError("");
    try {
      const result = await request(`/oauth/grants/${encodeURIComponent(clientId)}`, { method: "DELETE" });
      if (result.status === 401) return onExpired();
      if (!result.ok) throw new Error(errorOf(result, "Couldn't disconnect this app."));
      setGrants((list) => list.filter((item) => item.clientId !== clientId));
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming("");
    }
  }

  async function signOut() {
    try { await request("/auth/logout", { method: "POST" }); } catch { /* cookie clears server-side when reachable */ }
    onSignedOut();
  }

  return (
    <>
      <Brand />
      <section className="fa-card fa-card-wide">
        <div className="fa-profile">
          <Avatar user={user} size={56} />
          <span className="fa-account-copy">
            <strong>{userLabel(user)}</strong>
            <small>{user.email || (user.username ? `@${user.username}` : "")}</small>
          </span>
          <button className="fa-btn fa-btn-ghost fa-btn-sm" onClick={signOut}><Icon name="logout" size={15} /> Sign out</button>
        </div>

        <h2 className="fa-h2">Apps with access</h2>
        <p className="fa-sub fa-sub-tight">Apps you've signed in to with Fades. Removing one revokes its tokens right away.</p>

        {error && <div className="fa-alert fa-alert-error" role="alert"><Icon name="warning" size={16} /><span>{error}</span></div>}

        <div className="fa-grants">
          {loading ? (
            <Spinner label="Loading…" />
          ) : grants.length === 0 ? (
            <p className="fa-empty">No apps yet. When you sign in to an app with Fades, it shows up here.</p>
          ) : (
            grants.map((grant) => (
              <div className="fa-grant" key={grant.clientId}>
                <span className="fa-app-tile fa-app-tile-sm">{(grant.name || "?").slice(0, 1).toUpperCase()}</span>
                <span className="fa-account-copy">
                  <strong>{grant.name}</strong>
                  <small>
                    {(grant.scopes || []).map((s) => SCOPE_LABEL[s] || s).join(" · ")} · since {formatDate(grant.since)}
                  </small>
                </span>
                {confirming === grant.clientId ? (
                  <span className="fa-confirm">
                    <button className="fa-btn fa-btn-danger fa-btn-sm" onClick={() => disconnect(grant.clientId)}>Remove</button>
                    <button className="fa-btn fa-btn-ghost fa-btn-sm" onClick={() => setConfirming("")}>Keep</button>
                  </span>
                ) : (
                  <button className="fa-btn fa-btn-ghost fa-btn-sm" onClick={() => setConfirming(grant.clientId)}>Remove access</button>
                )}
              </div>
            ))
          )}
        </div>

        <a className="fa-dev-link" href={DEVELOPER_URL}>
          Building an app? Open the developer platform <Icon name="external" size={14} />
        </a>
      </section>
    </>
  );
}

export default function HomePage() {
  const [user, setUser] = useState(undefined); // undefined = checking
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchSession().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <Shell>
      {user === undefined ? (
        <Spinner label="Checking your session…" />
      ) : user === null ? (
        <>
          <Brand />
          <SignInPanel notice={notice} onAuthed={(next) => { setNotice(""); setUser(next); }} />
        </>
      ) : (
        <AccountView
          user={user}
          onSignedOut={() => { setNotice("You've been signed out."); setUser(null); }}
          onExpired={() => { setNotice("Your session expired. Sign in again."); setUser(null); }}
        />
      )}
    </Shell>
  );
}
