import type { SVGProps } from "react";

/**
 * Inline icon set. Hand-rolled rather than pulled from a library so the bundle
 * stays small and every glyph matches the app's stroke weight.
 */
type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5" />
      <path d="M8 7.5h7" />
      <path d="M8 11h5" />
    </svg>
  );
}

export function LaptopIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="11" rx="1.6" />
      <path d="M2 18.5h20" />
      <path d="M9.5 15.5h5" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.9" />
      <path d="M17.2 14.6A5.5 5.5 0 0 1 21 20" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3.5" />
      <path d="M8.5 21.5h7" />
    </svg>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9L21 12l-8.5 8.5a2.4 2.4 0 0 1-3.4-3.4L17.6 8.6z" />
      <path d="M14.7 6.3 17.6 3.4a4.5 4.5 0 0 1 2.9 2.9L17.6 9.2" />
      <path d="M3 3l4 4" />
    </svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="7" width="19" height="13" rx="2" />
      <path d="M8.5 7V5.4A1.4 1.4 0 0 1 9.9 4h4.2a1.4 1.4 0 0 1 1.4 1.4V7" />
      <path d="M2.5 12.5h19" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5 10.1 11.8 4.5 9.9 10.1 8z" />
      <path d="M18.5 15.5 19.4 18l2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.4 15.4 4.6 4.6" />
    </svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6.5h12" />
      <path d="M18.5 6.5H21" />
      <path d="M3 12h5" />
      <path d="M11 12h10" />
      <path d="M3 17.5h9" />
      <path d="M15 17.5h6" />
      <circle cx="16.5" cy="6.5" r="1.9" />
      <circle cx="9.5" cy="12" r="1.9" />
      <circle cx="13.5" cy="17.5" r="1.9" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base({ fill: "currentColor", stroke: "none", ...props })}>
      <path d="M12 3.2 14.6 9l6.3.8-4.6 4.3 1.2 6.2L12 17.4 6.5 20.3l1.2-6.2L3.1 9.8 9.4 9z" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21.5s7-6.4 7-11.2A7 7 0 0 0 5 10.3c0 4.8 7 11.2 7 11.2z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function RupeeIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.9, ...props })}>
      <path d="M7.5 4.5h9" />
      <path d="M7.5 8.5h9" />
      <path d="M7.5 12.5h4.2c2.6 0 4.3-1.6 4.3-4s-1.7-4-4.3-4H7.5" />
      <path d="M11 12.5 16 19.5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2.2, ...props })}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2, ...props })}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2, ...props })}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.9, ...props })}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2.8 20 6v6.4c0 4.5-3.2 7.4-8 8.8-4.8-1.4-8-4.3-8-8.8V6z" />
      <path d="m8.6 12 2.4 2.4 4.4-4.6" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13.2 2.5 4.8 13.2h5.4l-.6 8.3 8.6-10.9h-5.6z" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5V12" />
      <path d="M11 20.5V6.5" />
      <path d="M15.5 20.5v-6" />
      <path d="M20 20.5V9" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3h7A1.5 1.5 0 0 1 14 4.5V21" />
      <path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5V21" />
      <path d="M2.5 21h19" />
      <path d="M7 7h4" />
      <path d="M7 11h4" />
      <path d="M7 15h4" />
      <path d="M17 14h1" />
    </svg>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 10.5v3a1.5 1.5 0 0 0 1.5 1.5h2l6 4.5V4.5L7 9H5a1.5 1.5 0 0 0-1.5 1.5z" />
      <path d="M16.5 9.2a4 4 0 0 1 0 5.6" />
      <path d="M19 6.6a7.5 7.5 0 0 1 0 10.8" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16" />
      <path d="M9.5 6.5V4.2A1.2 1.2 0 0 1 10.7 3h2.6a1.2 1.2 0 0 1 1.2 1.2v2.3" />
      <path d="M6.5 6.5 7.4 20a1.2 1.2 0 0 0 1.2 1.1h6.8a1.2 1.2 0 0 0 1.2-1.1l.9-13.5" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20s-7.5-4.7-7.5-10a4.3 4.3 0 0 1 7.5-2.8A4.3 4.3 0 0 1 19.5 10c0 5.3-7.5 10-7.5 10z" />
    </svg>
  );
}

export function RepeatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 9.5A3.5 3.5 0 0 1 7 6h11" />
      <path d="m15 3 3.5 3L15 9" />
      <path d="M20.5 14.5a3.5 3.5 0 0 1-3.5 3.5H6" />
      <path d="m9 14.5-3.5 3.5L9 21.5" />
    </svg>
  );
}

export function AwardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.2 13.6-1.7 7.4 5.5-2.8 5.5 2.8-1.7-7.4" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 5.5v-1a1 1 0 0 0-1-1h-10a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 5.5h17l-6.5 7.5v6l-4 2v-8z" />
    </svg>
  );
}
