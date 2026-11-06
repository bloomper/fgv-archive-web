"use client";

import { useState } from "react";

/**
 * Local state over a value from the server, for changes shown at once while they are saved: it starts as the value and
 * starts over whenever the server sends a different one. Plain `useState(value)` would keep its first value for as
 * long as the component lives, and with `cacheComponents` Next keeps visited pages alive, so coming back to a page
 * would show what it had before changes made elsewhere. `key` tells values apart (by default `Object.is`), for arrays
 * and objects that arrive as new copies with the same content.
 */
export function useServerState<T>(value: T, key: (value: T) => unknown = value => value) {
  const [state, setState] = useState(value);
  const [seen, setSeen] = useState(() => key(value));
  const current = key(value);

  if (!Object.is(current, seen)) {
    setSeen(current);
    setState(value);
  }
  return [state, setState] as const;
}
