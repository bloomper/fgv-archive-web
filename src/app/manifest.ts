import type { MetadataRoute } from "next";

/**
 * Makes Spexarkiv installable on phones and tablets, so that a score opens like an app on the music stand.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spexarkiv",
    short_name: "Spexarkiv",
    description: "Spexens manus och arrangemang",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1447e6",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
