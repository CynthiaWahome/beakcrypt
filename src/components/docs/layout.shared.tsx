import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Beakcrypt",
    },
    themeSwitch: {
      enabled: false,
    },
    githubUrl: "https://github.com/prudentbird/beakcrypt",
  };
}
