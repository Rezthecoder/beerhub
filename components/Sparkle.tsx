/** Four-point sparkle, the same decoration used on rezkaihatsu.com. */
export default function Sparkle({ fill = '#86efac', style }: { fill?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className="sparkle" style={style} aria-hidden="true">
      <path
        d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z"
        fill={fill}
        stroke="#111827"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
