
function Logo({ size = 40 }) {
  return (
    <div className="taskflow-logo" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 40 40"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="TaskFlow logo"
        role="img"
      >
        <rect width="40" height="40" rx="12" fill="#4F46E5" />
        <path
          d="M11 20.5L17 26.5L29 14.5"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default Logo;
