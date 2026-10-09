"use client";

import { useEffect, useState } from "react";

export function AppTile({ name, src, small = false }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const showImage = Boolean(src) && !broken;
  const letter = (name || "?").trim().slice(0, 1).toUpperCase() || "?";

  return (
    <span
      className={`fa-app-tile ${small ? "fa-app-tile-sm" : ""} ${showImage ? "fa-app-tile-img" : ""}`}
    >
      {showImage ? (
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        letter
      )}
    </span>
  );
}
