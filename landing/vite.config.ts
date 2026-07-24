import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Facebook's scraper needs ABSOLUTE og:image/og:url values. VITE_SITE_URL is
 * the canonical production origin (e.g. https://pearl.example.com, no trailing
 * slash); when set, this plugin absolutises og:image and injects og:url plus a
 * canonical link. When unset, a production build warns loudly — the share card
 * will not render on Facebook/WhatsApp until it is configured.
 */
function absoluteSocialTags(siteUrl: string, isProdBuild: boolean): Plugin {
  return {
    name: "pearl-absolute-social-tags",
    transformIndexHtml(html) {
      if (!siteUrl) {
        if (isProdBuild) {
          console.warn(
            "\n[pearl] VITE_SITE_URL is not set — og:image stays relative and og:url/canonical " +
              "are omitted. Facebook link previews will be broken in this build.\n",
          );
        }
        return html;
      }
      return {
        html: html.replace(
          '<meta property="og:image" content="/og/pearl-og.jpg" />',
          `<meta property="og:image" content="${siteUrl}/og/pearl-og.jpg" />`,
        ),
        tags: [
          { tag: "meta", attrs: { property: "og:url", content: `${siteUrl}/` }, injectTo: "head" },
          { tag: "link", attrs: { rel: "canonical", href: `${siteUrl}/` }, injectTo: "head" },
        ],
      };
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, __dirname, "");
  const siteUrl = (env.VITE_SITE_URL ?? "").trim().replace(/\/+$/, "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      absoluteSocialTags(siteUrl, command === "build" && mode === "production"),
    ],
  };
});
