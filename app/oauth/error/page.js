"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Brand, Icon, MAIN_URL, Shell } from "../../components/auth-kit";

function ErrorView() {
  const search = useSearchParams();
  // Short, user-facing text only. React escapes it, so it can't inject markup.
  const message = (search.get("message") || "").slice(0, 200) || "Something went wrong with this sign-in request.";

  return (
    <>
      <Brand />
      <section className="fa-card fa-center">
        <div className="fa-badge fa-badge-bad"><Icon name="warning" size={24} /></div>
        <h1 className="fa-title">We couldn't sign you in</h1>
        <p className="fa-sub">{message}</p>
        <p className="fa-sub">Go back to the app you came from and try again. If this keeps happening, contact the app's developer.</p>
        <div className="fa-actions">
          <a className="fa-btn fa-btn-ghost" href={MAIN_URL}>Go to Fades</a>
        </div>
      </section>
    </>
  );
}

export default function OAuthErrorPage() {
  return (
    <Shell>
      <Suspense fallback={null}>
        <ErrorView />
      </Suspense>
    </Shell>
  );
}
