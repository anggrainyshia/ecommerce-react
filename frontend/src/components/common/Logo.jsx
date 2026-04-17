export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { svg: 28, text: 'text-lg' },
    md: { svg: 36, text: 'text-2xl' },
    lg: { svg: 52, text: 'text-4xl' },
  };
  const { svg, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svg}
        height={svg}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        {/* Shopping bag body */}
        <rect x="10" y="22" width="44" height="34" rx="5" fill="#6366F1" />
        {/* Bag handle */}
        <path
          d="M22 22 C22 14 42 14 42 22"
          stroke="#6366F1"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Pixel/bit dots – 2×3 grid */}
        <rect x="20" y="32" width="6" height="6" rx="1" fill="white" opacity="0.9" />
        <rect x="29" y="32" width="6" height="6" rx="1" fill="white" opacity="0.5" />
        <rect x="38" y="32" width="6" height="6" rx="1" fill="white" opacity="0.9" />
        <rect x="20" y="41" width="6" height="6" rx="1" fill="white" opacity="0.5" />
        <rect x="29" y="41" width="6" height="6" rx="1" fill="white" opacity="0.9" />
        <rect x="38" y="41" width="6" height="6" rx="1" fill="white" opacity="0.5" />
      </svg>

      <span className={`font-bold tracking-tight ${text}`}>
        <span className="text-indigo-600">Every</span>
        <span className="text-gray-800">Bit</span>
      </span>
    </div>
  );
}
