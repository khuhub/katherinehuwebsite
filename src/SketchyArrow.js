function SketchyArrow() {
  return (
    <div style={{
      position: 'absolute',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2,
    }}>
      <svg width="50" height="72" viewBox="0 0 50 72" fill="none">
        {/* Shaft */}
        <path
          d="M25,4 C24,14 26,26 24,50"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="50"
          style={{ animation: 'drawShaft 2.4s ease-in-out infinite' }}
        />
        {/* Left head */}
        <path
          d="M24,50 C20,42 12,44 6,54"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="26"
          style={{ animation: 'drawLeft 2.4s ease-in-out infinite' }}
        />
        {/* Right head */}
        <path
          d="M24,50 C28,42 36,44 44,54"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="26"
          style={{ animation: 'drawRight 2.4s ease-in-out infinite' }}
        />
      </svg>
    </div>
  );
}

export default SketchyArrow;
