import { useState, useEffect, useRef } from 'react';
import './App.css';
import SquigglyLine from './SquigglyLine';
import CorgiWalker from './CorgiWalker';

const serif = 'Lora, Georgia, serif';

const boxItems = [
  { src: '/food.png',   width: '480px', openTransform: 'translateX(-460px) translateY(-280px)', delay: 0,
    tooltip: 'If you see me, 9 times out of 10 I will be munching away at something...',
    bubbleStyle: { top: '65%', left: '32%' },
    tailStyle: { top: '-9px', left: '55%', transform: 'translateX(-50%)', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '10px solid white' },
  },
  { src: '/draw.png',   width: '460px', openTransform: 'translateX(-290px) translateY(-480px)', delay: 0.07,
    tooltip: 'Doodling is one of my favorite stress relievers :)',
    bubbleStyle: { top: '35%', left: '50%' },
    tailStyle: { top: '65%', transform: 'translateY(-65%)', left: '-9px', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid white' },
  },
  { src: '/guitar.png', width: '500px', openTransform: 'translateX(-180px) translateY(-180px)', delay: 0.13,
    tooltip: 'I love self-learning guitar in my free time!',
    bubbleStyle: { top: '45%', left: '55%' },
    tailStyle: { top: '65%', transform: 'translateY(-65%)', left: '-9px', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid white' },
  },
  { src: '/lucky.png',  width: '440px', openTransform: 'translateX(60px)   translateY(-320px)', delay: 0.19,
    tooltip: "Fun fact: I was born on St. Patrick's day!",
    bubbleStyle: { top: '15%', left: '25%' },
    tailStyle: { bottom: '-9px', left: '40%', transform: 'translateX(-50%)', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid white' },
  },
];

function App() {
  const [shaking, setShaking] = useState(false);
  const [corgiStarted, setCorgiStarted] = useState(false);
  const aboutRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setCorgiStarted(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (aboutRef.current) observer.observe(aboutRef.current);
    return () => observer.disconnect();
  }, []);
  const [boxOpen, setBoxOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleCenterHover = () => {
    if (!shaking) {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div>
      <SquigglyLine />

      {/* Hero */}
      <section style={{ backgroundColor: '#FFF9DC', height: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden' }}>
        <img
          src="/hero1.png"
          alt="Katherine Hu"
          style={{ maxWidth: '1380px', maxHeight: '95vh', objectFit: 'cover', objectPosition: 'bottom', width: '100%', marginTop: '-40px', position: 'relative', zIndex: 1 }}
        />
      </section>

      {/* About Me */}
      <section ref={aboutRef} style={{ backgroundColor: '#FFF9DC', minHeight: '100vh', padding: '120px 0 90px 10%', position: 'relative', overflow: 'hidden' }}>
        <h2 style={{ fontFamily: serif, fontSize: '36px', fontWeight: '700', letterSpacing: '4px', color: '#1a1a1a', margin: '0 0 60px 0' }}>
          ABOUT ME
        </h2>
        <p style={{ fontFamily: serif, fontSize: '18px', lineHeight: '2', color: '#1a1a1a', maxWidth: '680px', margin: 0 }}>
          Hi! I'm <strong>Katherine</strong>, a computer science student at{' '}
          <span style={{ fontWeight: '700' }}>Cornell University</span>{' '}
          who enjoys building thoughtful user-focused technology &amp; exploring how software
          can create meaningful impact. I love learning new things, solving challenging problems,
          and working at the intersection of engineering, design, and creativity. Beyond coding,
          I care a lot about collaboration, leadership, and creating spaces where people can
          learn and grow together :)
        </p>
        <CorgiWalker started={corgiStarted} />
        <div style={{ position: 'absolute', bottom: '30px', right: '150px', width: '600px', zIndex: 2 }}>
          {/* Pop-up items */}
          {boxItems.map(item => (
            <div
              key={item.src}
              onMouseEnter={() => boxOpen && item.tooltip && setHoveredItem(item.src)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                position: 'absolute',
                bottom: '30%',
                left: '50%',
                width: item.width,
                transform: boxOpen ? item.openTransform : 'translateX(-50%) translateY(10px)',
                opacity: boxOpen ? 1 : 0,
                transition: `transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${item.delay}s, opacity 0.25s ease ${item.delay}s`,
                pointerEvents: boxOpen ? 'auto' : 'none',
                zIndex: 3,
              }}
            >
              <img src={item.src} alt="" style={{ width: '100%', display: 'block', transform: hoveredItem === item.src ? 'scale(1.07)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
              {/* Speech bubble */}
              {item.tooltip && hoveredItem === item.src && (
                <div style={{
                  position: 'absolute',
                  ...item.bubbleStyle,
                  backgroundColor: 'white',
                  borderRadius: '18px',
                  padding: '14px 18px',
                  width: '180px',
                  boxShadow: '0 3px 14px rgba(0,0,0,0.12)',
                  zIndex: 10,
                  boxSizing: 'border-box',
                }}>
                  <div style={{ position: 'absolute', width: 0, height: 0, ...item.tailStyle }} />
                  <p style={{ fontFamily: serif, fontSize: '12px', color: '#333', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                    {item.tooltip}
                  </p>
                </div>
              )}
            </div>
          ))}
          {/* Box image on top so items appear to emerge from it */}
          <img
            src={boxOpen ? '/openbox.png' : '/box.png'}
            alt="box"
            className={!boxOpen ? `box-img${shaking ? ' shaking' : ''}` : ''}
            style={{ width: '100%', display: 'block', position: 'relative', zIndex: 4 }}
          />
          <p style={{ fontFamily: serif, fontSize: '16px', color: '#888', margin: 0, position: 'absolute', top: '65%', left: '360px', zIndex: 5, whiteSpace: 'nowrap' }}>{boxOpen ? 'click to close!' : 'click to open!'}</p>
          {/* Center hover/click trigger */}
          <div
            onMouseEnter={handleCenterHover}
            onClick={() => setBoxOpen(o => !o)}
            style={{ position: 'absolute', top: '30%', left: '30%', width: '40%', height: '40%', cursor: 'pointer', zIndex: 5 }}
          />
        </div>
      </section>
    </div>
  );
}

export default App;
