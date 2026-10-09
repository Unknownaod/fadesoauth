
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

  if (!date || Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const SCOPE_LABEL = {
  openid: "Identity",
  profile: "Profile",
  email: "Email",
};

const SCOPE_DESCRIPTION = {
  openid: "Identify your Fades account.",
  profile: "Access your permitted profile information.",
  email: "Access your email address.",
};

function ScopeList({ scopes = [] }) {
  if (!scopes.length) {
    return <span className="fa-scope-muted">No permission details available</span>;
  }

  return (
    <div className="fa-scope-list">
      {scopes.map((scope) => (
        <div className="fa-scope-row" key={scope}>
          <span className="fa-scope-check" aria-hidden="true">
            <Icon name="check" size={16} />
          </span>

          <span className="fa-scope-copy">
            <strong>{SCOPE_LABEL[scope] || scope}</strong>
            <small>
              {SCOPE_DESCRIPTION[scope] ||
                "Permission granted to this application."}
            </small>
          </span>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ active, onNavigate, user, onSignOut }) {
  const items = [
    { id: "account", label: "My account", icon: "user-round" },
    { id: "connections", label: "Authorized apps", icon: "app-window" },
  ];

  return (
    <aside className="fa-settings-sidebar">
      <a className="fa-sidebar-brand" href="/" aria-label="Fades Account home">
        <span className="fa-sidebar-logo">
          <Brand />
        </span>
      </a>

      <div className="fa-sidebar-heading">USER SETTINGS</div>

      <nav className="fa-sidebar-nav" aria-label="Account settings">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`fa-sidebar-item ${
              active === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="fa-sidebar-divider" />

      <a
        className="fa-sidebar-item fa-sidebar-link"
        href={DEVELOPER_URL}
      >
        <Icon name="code-2" size={18} />
        <span>Developer platform</span>
        <Icon name="external" size={13} />
      </a>

      <div className="fa-sidebar-user">
        <Avatar user={user} size={36} />

        <span className="fa-sidebar-user-copy">
          <strong>{userLabel(user)}</strong>
          <small>Signed in to Fades</small>
        </span>

        <button
          type="button"
          className="fa-sidebar-logout"
          title="Sign out"
          aria-label="Sign out"
          onClick={onSignOut}
        >
          <Icon name="log-out" size={17} />
        </button>
      </div>
    </aside>
  );
}

function AccountOverview({ user, onSignOut, onNavigate }) {
  return (
    <div className="fa-settings-content">
      <div className="fa-page-heading">
        <div>
          <div className="fa-breadcrumb">USER SETTINGS / MY ACCOUNT</div>
          <h1>My account</h1>
          <p>Manage your Fades identity and account access.</p>
        </div>
      </div>

      <section className="fa-settings-section">
        <div className="fa-section-heading">
          <h2>Account profile</h2>
          <span className="fa-status-pill">
            <span />
            Signed in
          </span>
        </div>

        <div className="fa-profile-banner">
          <div className="fa-profile-banner-top" />

          <div className="fa-profile-details">
            <Avatar user={user} size={76} />

            <div className="fa-profile-identity">
              <h3>{userLabel(user)}</h3>
              <p>{user.email || (user.username ? `@${user.username}` : "Fades account")}</p>
            </div>

            <button
              type="button"
              className="fa-btn fa-btn-ghost"
              onClick={onSignOut}
            >
              <Icon name="log-out" size={16} />
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="fa-settings-section">
        <div className="fa-section-heading">
          <div>
            <h2>Connected applications</h2>
            <p>Review the applications authorized to access your account.</p>
          </div>
        </div>

        <div className="fa-settings-info-card">
          <div className="fa-info-icon">
            <Icon name="shield-check" size={22} />
          </div>

          <div>
            <strong>Your account, your control</strong>
            <p>
              You can review permissions and revoke an application's access
              whenever you want.
            </p>
          </div>

          <button
            type="button"
            className="fa-btn fa-btn-primary"
            onClick={() => onNavigate("connections")}
          >
            Manage apps
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </section>

      <section className="fa-settings-section">
        <div className="fa-section-heading">
          <h2>Developer resources</h2>
        </div>

        <a className="fa-developer-card" href={DEVELOPER_URL}>
          <div className="fa-developer-icon">
            <Icon name="code-2" size={22} />
          </div>

          <div>
            <strong>Build with Fades</strong>
            <p>Register applications and integrate Fades OAuth.</p>
          </div>

          <Icon name="external" size={17} />
        </a>
      </section>
    </div>
  );
}

function ConnectionsView({ user, grants, loading, error, confirming, onConfirm, onDisconnect, onNavigate }) {
  return (
    <div className="fa-settings-content">
      <div className="fa-page-heading">
        <div>
          <div className="fa-breadcrumb">
            USER SETTINGS / AUTHORIZED APPS
          </div>
          <h1>Authorized apps</h1>
          <p>
            These applications have been granted access to your Fades account.
          </p>
        </div>
      </div>

      {error && (
        <div className="fa-alert fa-alert-error" role="alert">
          <Icon name="triangle-alert" size={17} />
          <span>{error}</span>
        </div>
      )}

      <section className="fa-settings-section">
        <div className="fa-section-heading">
          <div>
            <h2>Your applications</h2>
            <p>
              {loading
                ? "Loading your connected applications…"
                : `${grants.length} authorized ${
                    grants.length === 1 ? "application" : "applications"
                  }`}
            </p>
          </div>

          <button
            type="button"
            className="fa-btn fa-btn-ghost"
            onClick={() => onNavigate("account")}
          >
            <Icon name="arrow-left" size={16} />
            Back to account
          </button>
        </div>

        {loading ? (
          <div className="fa-settings-loading">
            <Spinner label="Loading applications…" />
          </div>
        ) : grants.length === 0 ? (
          <div className="fa-empty-state">
            <div className="fa-empty-icon">
              <Icon name="app-window" size={30} />
            </div>

            <h3>No authorized apps yet</h3>

            <p>
              When you sign in to another service using Fades, its
              authorization will appear here.
            </p>

            <a className="fa-btn fa-btn-primary" href={DEVELOPER_URL}>
              Explore developer tools
              <Icon name="arrow-up-right" size={16} />
            </a>
          </div>
        ) : (
          <div className="fa-connected-apps">
            {grants.map((grant) => (
              <article className="fa-connected-app" key={grant.clientId}>
                <div className="fa-connected-app-top">
                  <div className="fa-connected-app-identity">
                    <span className="fa-app-tile">
                      {(grant.name || "?").slice(0, 1).toUpperCase()}
                    </span>

                    <div className="fa-connected-app-copy">
                      <h3>{grant.name || "Unnamed application"}</h3>
                      <span className="fa-connected-app-date">
                        Authorized {formatDate(grant.since)}
                      </span>
                    </div>
                  </div>

                  {confirming === grant.clientId ? (
                    <div className="fa-confirm">
                      <button
                        type="button"
                        className="fa-btn fa-btn-danger fa-btn-sm"
                        onClick={() => onDisconnect(grant.clientId)}
                      >
                        Confirm revoke
                      </button>

                      <button
                        type="button"
                        className="fa-btn fa-btn-ghost fa-btn-sm"
                        onClick={() => onConfirm("")}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="fa-btn fa-btn-danger-outline"
                      onClick={() => onConfirm(grant.clientId)}
                    >
                      Revoke access
                    </button>
                  )}
                </div>

                <div className="fa-connected-app-permissions">
                  <div className="fa-permissions-heading">
                    <Icon name="shield-check" size={15} />
                    Granted permissions
                  </div>

                  <ScopeList scopes={grant.scopes || []} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="fa-security-note">
        <Icon name="shield-check" size={18} />

        <p>
          <strong>Security tip</strong>
          <span>
            Only authorize applications you trust. Revoking access removes
            the authorization through your Fades account API.
          </span>
        </p>
      </div>

      <div className="fa-current-account-note">
        Managing access for <strong>{userLabel(user)}</strong>
      </div>
    </div>
  );
}

function AccountView({ user, onSignedOut, onExpired }) {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState("connections");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request("/oauth/grants");

      if (result.status === 401) {
        onExpired();
        return;
      }

      if (!result.ok) {
        throw new Error(
          errorOf(result, "Couldn't load your connected apps.")
        );
      }

      setGrants(
        Array.isArray(result.data.apps) ? result.data.apps : []
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [onExpired]);

  useEffect(() => {
    load();
  }, [load]);

  async function disconnect(clientId) {
    setError("");

    try {
      const result = await request(
        `/oauth/grants/${encodeURIComponent(clientId)}`,
        { method: "DELETE" }
      );

      if (result.status === 401) {
        onExpired();
        return;
      }

      if (!result.ok) {
        throw new Error(
          errorOf(result, "Couldn't disconnect this app.")
        );
      }

      setGrants((list) =>
        list.filter((item) => item.clientId !== clientId)
      );
    } catch (err) {
      setError(err.message || "Couldn't revoke application access.");
    } finally {
      setConfirming("");
    }
  }

  async function signOut() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // Preserve the existing client-side sign-out behavior.
    }

    onSignedOut();
  }

  return (
    <div className="fa-account-layout">
      <Sidebar
        active={active}
        onNavigate={setActive}
        user={user}
        onSignOut={signOut}
      />

      <main className="fa-settings-main">
        <div className="fa-mobile-header">
          <Brand />

          <button
            type="button"
            className="fa-btn fa-btn-ghost fa-btn-sm"
            onClick={signOut}
          >
            <Icon name="log-out" size={16} />
            Sign out
          </button>
        </div>

        {active === "account" ? (
          <AccountOverview
            user={user}
            onSignOut={signOut}
            onNavigate={setActive}
          />
        ) : (
          <ConnectionsView
            user={user}
            grants={grants}
            loading={loading}
            error={error}
            confirming={confirming}
            onConfirm={setConfirming}
            onDisconnect={disconnect}
            onNavigate={setActive}
          />
        )}

        <footer className="fa-settings-footer">
          <span>Fades Account</span>
          <span className="fa-footer-dot">•</span>
          <span>Secure account management</span>
        </footer>
      </main>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState(undefined);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    fetchSession()
      .then((next) => {
        if (mounted) setUser(next);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Shell>
      {user === undefined ? (
        <Spinner label="Checking your session…" />
      ) : user === null ? (
        <>
          <Brand />

          <SignInPanel
            notice={notice}
            onAuthed={(next) => {
              setNotice("");
              setUser(next);
            }}
          />
        </>
      ) : (
        <AccountView
          user={user}
          onSignedOut={() => {
            setNotice("You've been signed out.");
            setUser(null);
          }}
          onExpired={() => {
            setNotice("Your session expired. Sign in again.");
            setUser(null);
          }}
        />
      )}
    </Shell>
  );
}
