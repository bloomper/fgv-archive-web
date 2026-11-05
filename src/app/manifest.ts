import type { MetadataRoute } from "next";

/**
 * Makes Spexarkivet installable on phones and tablets, so that a score opens like an app on the music stand.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spexarkivet",
    short_name: "Spexarkivet",
    description: "Spexens manus och arrangemang",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfaf4",
    theme_color: "#7a1f2b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
