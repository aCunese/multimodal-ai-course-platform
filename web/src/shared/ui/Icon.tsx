import type { CSSProperties } from "react";

import type { IconName } from "../types/platform";

type IconProps = {
  name: IconName;
  className?: string;
  size?: number;
  style?: CSSProperties;
};

export function Icon({ name, className, size = 20, style }: IconProps) {
  const sharedProps = {
    className,
    style,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...sharedProps}>
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6 10.5V19h12v-8.5" />
        </svg>
      );
    case "image":
      return (
        <svg {...sharedProps}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
          <circle cx="9" cy="10" r="1.4" />
          <path d="m7 17 4.5-4.5 2.8 2.8 2.7-3.3L20 15.5" />
        </svg>
      );
    case "heart":
      return (
        <svg {...sharedProps}>
          <path d="M12 20s-6.8-4.6-8.3-8.2C2.6 9 4.1 6 7.3 6c1.9 0 3.1 1 4.7 2.8C13.6 7 14.8 6 16.7 6c3.2 0 4.7 3 3.6 5.8C18.8 15.4 12 20 12 20Z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...sharedProps}>
          <path d="m5 19 3.4-.7L18 8.7a2.2 2.2 0 1 0-3.1-3.1L5.3 15.2 5 19Z" />
          <path d="m12.8 7.7 3.5 3.5" />
        </svg>
      );
    case "museum":
      return (
        <svg {...sharedProps}>
          <path d="M3.5 9.5 12 5l8.5 4.5" />
          <path d="M5 19.5h14" />
          <path d="M6.5 10.5v8" />
          <path d="M10.5 10.5v8" />
          <path d="M13.5 10.5v8" />
          <path d="M17.5 10.5v8" />
        </svg>
      );
    case "history":
      return (
        <svg {...sharedProps}>
          <path d="M4 12a8 8 0 1 0 2.3-5.6" />
          <path d="M4 4v5h5" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    case "search":
      return (
        <svg {...sharedProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "download":
      return (
        <svg {...sharedProps}>
          <path d="M12 4v10" />
          <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
          <path d="M5 19h14" />
        </svg>
      );
    case "file":
      return (
        <svg {...sharedProps}>
          <path d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
          <path d="M14 3.5V8h4" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
    case "user":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19c1.2-2.8 3.5-4.2 7-4.2S17.8 16.2 19 19" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...sharedProps}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case "check":
      return (
        <svg {...sharedProps}>
          <path d="m5 12 4.2 4.2L19 6.4" />
        </svg>
      );
    case "spark":
      return (
        <svg {...sharedProps}>
          <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...sharedProps}>
          <path d="M5 19V9" />
          <path d="M11 19V5" />
          <path d="M17 19v-7" />
          <path d="M3.5 19.5h17" />
        </svg>
      );
    case "layers":
      return (
        <svg {...sharedProps}>
          <path d="m12 4 8 4.5-8 4.5-8-4.5L12 4Z" />
          <path d="m4 12 8 4.5 8-4.5" />
          <path d="m4 15.5 8 4.5 8-4.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...sharedProps}>
          <path d="M12 4 18 6.2v4.3c0 4.1-2.4 7.7-6 9.5-3.6-1.8-6-5.4-6-9.5V6.2L12 4Z" />
        </svg>
      );
    case "cube":
      return (
        <svg {...sharedProps}>
          <path d="m12 3.8 7 4v8.4l-7 4-7-4V7.8l7-4Z" />
          <path d="M12 12.2 19 8" />
          <path d="M12 12.2 5 8" />
          <path d="M12 12.2V20" />
        </svg>
      );
    case "upload":
      return (
        <svg {...sharedProps}>
          <path d="M12 16V6" />
          <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
          <path d="M5 19h14" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...sharedProps}>
          <path d="M19 5v5h-5" />
          <path d="M5 19v-5h5" />
          <path d="M18 10a7 7 0 0 0-11.9-2.9L4 10" />
          <path d="M6 14a7 7 0 0 0 11.9 2.9L20 14" />
        </svg>
      );
    case "light":
      return (
        <svg {...sharedProps}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3.5a5.5 5.5 0 0 0-3.6 9.7c.8.7 1.2 1.5 1.3 2.3h4.6c.1-.8.5-1.6 1.3-2.3A5.5 5.5 0 0 0 12 3.5Z" />
        </svg>
      );
    case "filter":
      return (
        <svg {...sharedProps}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4.5l3 1.5" />
        </svg>
      );
    case "database":
      return (
        <svg {...sharedProps}>
          <ellipse cx="12" cy="6.5" rx="6.5" ry="2.7" />
          <path d="M5.5 6.5v8c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7v-8" />
          <path d="M5.5 10.5c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7" />
        </svg>
      );
    case "copy":
      return (
        <svg {...sharedProps}>
          <rect x="9" y="8" width="10" height="12" rx="2" />
          <path d="M15 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
        </svg>
      );
    case "tag":
      return (
        <svg {...sharedProps}>
          <path d="M11 4H6a2 2 0 0 0-2 2v5l8 8 8-8-8-8Z" />
          <circle cx="8" cy="8" r="1.2" />
        </svg>
      );
    default:
      return null;
  }
}
