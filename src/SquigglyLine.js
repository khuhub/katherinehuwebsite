import { useEffect, useRef } from 'react';

const tau = 2 * Math.PI;

// Equal radii for x and y at each frequency → circular loops
// Multiple incommensurable frequencies → natural variation in loop spacing
function getPoint(t, W, H) {
  const baseX = t * W;
  const baseY = H * (1 - t);

  const r1 = 90, f1 = 2.5;
  const r2 = 45, f2 = 5.7;
  const r3 = 22, f3 = 8.3;

  // subtract value at t=0 so start is exactly (0, H)
  const dx = r1 * Math.sin(f1 * tau * t)
           + r2 * Math.sin(f2 * tau * t)
           + r3 * Math.sin(f3 * tau * t);

  const dy = r1 * (Math.cos(f1 * tau * t) - 1)
           + r2 * (Math.cos(f2 * tau * t) - 1)
           + r3 * (Math.cos(f3 * tau * t) - 1);

  return { x: baseX + dx, y: baseY + dy };
}

function SquigglyLine() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const totalPoints = 2000;
    let progress = 0;
    let animId;

    const onScroll = () => {
      const scrolled = window.scrollY;
      const heroHeight = window.innerHeight;
      const opacity = Math.max(0, 1 - scrolled / heroHeight);
      canvas.style.opacity = opacity;
    };
    window.addEventListener('scroll', onScroll);

    function draw() {
      const end = Math.min(Math.floor(progress), totalPoints);

      ctx.clearRect(0, 0, W, H);

      if (end > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        for (let i = 0; i <= end; i++) {
          const { x, y } = getPoint(i / totalPoints, W, H);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }

      if (progress < totalPoints) {
        progress += 8;
        animId = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default SquigglyLine;
