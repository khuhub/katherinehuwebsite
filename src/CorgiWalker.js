import { useState, useEffect, useRef } from 'react';

const WALK_DURATION = 5000;
const FRAME_INTERVAL = 180;
const DRIFT_ANIMS = ['floatZ-0', 'floatZ-1', 'floatZ-2', 'floatZ-3', 'floatZ-4'];

function CorgiWalker({ started }) {
  const [frame, setFrame] = useState(1);
  const [arrived, setArrived] = useState(false);
  const [zees, setZees] = useState([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!started) return;

    const frameTimer = setInterval(() => {
      setFrame(f => (f === 1 ? 2 : 1));
    }, FRAME_INTERVAL);

    const arriveTimer = setTimeout(() => {
      setArrived(true);
      clearInterval(frameTimer);
    }, WALK_DURATION);

    return () => {
      clearInterval(frameTimer);
      clearTimeout(arriveTimer);
    };
  }, [started]);

  const handleClick = (e) => {
    if (!arrived) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    if (relX < 0.75) return;

    const id = nextId.current++;
    const newZees = Array.from({ length: 5 }, (_, i) => ({
      id: id * 10 + i,
      x: 62 + Math.random() * 14,
      y: 26 + Math.random() * 10,
      delay: i * 0.13,
      size: 13 + Math.random() * 14,
      anim: DRIFT_ANIMS[i],
    }));

    setZees(prev => [...prev, ...newZees]);
    setTimeout(() => {
      setZees(prev => prev.filter(z => !newZees.find(n => n.id === z.id)));
    }, 2500);
  };

  const src = arrived ? '/corgi3.png' : frame === 1 ? '/corgi1.png' : '/corgi2.png';

  return (
    <div
      className={!started ? '' : arrived ? 'corgi-arrived' : 'corgi-walk'}
      style={{
        position: 'absolute',
        bottom: arrived ? '-30px' : '-15px',
        width: '650px',
        transform: (!arrived && frame === 2) ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.08s ease-in-out',
        willChange: 'transform',
        cursor: arrived ? 'pointer' : 'default',
        zIndex: 3,
      }}
      onClick={handleClick}
    >
      <img src={src} alt="corgi" style={{ width: '100%', display: 'block' }} />
      {zees.map(z => (
        <span
          key={z.id}
          style={{
            position: 'absolute',
            left: `${z.x}%`,
            top: `${z.y}%`,
            fontSize: `${z.size}px`,
            fontWeight: 'bold',
            color: '#444',
            opacity: 0,
            pointerEvents: 'none',
            animation: `${z.anim} 1.8s ease-out forwards`,
            animationDelay: `${z.delay}s`,
          }}
        >
          z
        </span>
      ))}
    </div>
  );
}

export default CorgiWalker;
