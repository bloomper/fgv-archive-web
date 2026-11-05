import * as React from "react";

/**
 * Spexarkivet's wordmark, in the theme's foreground colour with "arkivet" in the brand colour.
 */
export function LogoText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 330 64"
      className={`block h-full w-full ${props.className ?? ""}`}
      role="img"
      aria-label="Spexarkivet"
      focusable="false"
      {...props}
    >
      <text x="0" y="46" fontFamily="var(--font-geist-sans), system-ui, sans-serif" fontSize="44" fontWeight="700"
            letterSpacing="-1" fill="currentColor">
        Spex<tspan className="fill-primary">arkivet</tspan>
      </text>
    </svg>
  );
}
