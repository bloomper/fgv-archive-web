import * as React from "react";

/**
 * Spexarkivet's mark: stacked sheets, the front one a page of music with a folded corner. The sheets take the brand
 * colour (currentColor), the paper stays paper in both themes.
 */
export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`block h-full w-full text-primary ${props.className ?? ""}`}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="17" y="5" width="36" height="46" rx="3" fill="currentColor" opacity="0.35" transform="rotate(8 35 28)" />
      <rect x="15" y="7" width="36" height="46" rx="3" fill="currentColor" opacity="0.6" transform="rotate(3 33 30)" />
      <path d="M11 11h28l11 11v34a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z" fill="#fdf8ee" stroke="currentColor"
            strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M39 11v8a3 3 0 0 0 3 3h8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M14 30h30M14 34h30M14 38h30M14 42h30M14 46h30" />
      </g>
      <g fill="currentColor">
        <ellipse cx="22" cy="44" rx="3.4" ry="2.5" transform="rotate(-20 22 44)" />
        <ellipse cx="35" cy="40" rx="3.4" ry="2.5" transform="rotate(-20 35 40)" />
        <path d="M24.8 43.2V25.5L38 22v16.5h-1.6V25l-10 2.6v15.6z" />
      </g>
    </svg>
  );
}
