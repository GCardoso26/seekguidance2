type Props = {
  className?: string;
  size?: number;
};

/** Marca Judge TCG — balança sobre cartas (SVG). */
export function JudgeLogo({ className, size = 40 }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15" />
      <path
        d="M20 8v4M14 12h12"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M20 12v3.5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 18.5 20 15.5l8 3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="22" rx="5" ry="1.75" stroke="white" strokeWidth="1.5" />
      <ellipse cx="28" cy="22" rx="5" ry="1.75" stroke="white" strokeWidth="1.5" />
      <path
        d="M12 22v2.5M28 22v2.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="10" y="27" width="8" height="5" rx="1.25" fill="white" fillOpacity="0.9" />
      <rect x="22" y="27" width="8" height="5" rx="1.25" fill="white" fillOpacity="0.55" />
    </svg>
  );
}
