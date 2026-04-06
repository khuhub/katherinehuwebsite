import { useState, useEffect, useRef } from 'react';
import './App.css';
import SquigglyLine from './SquigglyLine';
import CorgiWalker from './CorgiWalker';
import Dither from './Dither';

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
    bubbleStyle: { top: '12%', left: '25%' },
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { setAboutVisible(entry.isIntersecting); },
      { threshold: 0.15 }
    );
    if (aboutRef.current) observer.observe(aboutRef.current);
    return () => observer.disconnect();
  }, []);

  const [boxOpen, setBoxOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredExp, setHoveredExp] = useState(null);
  const [grassFade, setGrassFade] = useState(0);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [polaroidTilts, setPolaroidTilts] = useState({});
  const lastMouseX = useRef({});
  const [visibleExps, setVisibleExps] = useState({});
  const [seenExps, setSeenExps] = useState({});
  const [textVisible, setTextVisible] = useState({ young: false, old: false });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!boxOpen) {
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [boxOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (!aboutRef.current) return;
      const rect = aboutRef.current.getBoundingClientRect();
      const fade = Math.max(0, Math.min(1, (-rect.bottom + 100) / 700));
      setGrassFade(fade);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const textRef = (key) => (el) => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { setTextVisible(prev => ({ ...prev, [key]: entry.isIntersecting })); },
      { threshold: 0.05 }
    );
    obs.observe(el);
  };

  const allExpsSeen = Object.keys(seenExps).length >= 5;

  const expRef = (i) => (el) => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisibleExps(prev => ({ ...prev, [i]: entry.isIntersecting }));
        if (entry.isIntersecting) setSeenExps(prev => ({ ...prev, [i]: true }));
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
  };

  const handleCenterHover = () => {
    if (!shaking) {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section style={{ backgroundColor: '#FFF9DC', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden', scrollSnapAlign: 'start', position: 'relative', paddingBottom: '40px', paddingTop: '0', margin: '0' }}>
        <SquigglyLine />
        <div className="hero-wrapper" style={{ width: '100%', maxWidth: '1380px', zIndex: 3, display: 'flex', flexDirection: 'column', margin: '0', padding: '0' }}>
          <div style={{ position: 'relative' }}>
            <img
              src="/hero1.png"
              alt="Katherine Hu"
              style={{ width: '100%', height: 'auto', display: 'block', marginTop: '-60px' }}
            />
          <div className="hero-icons">
            {[
              { href: 'https://github.com/khuhub', src: '/git.png' },
              { href: 'https://www.linkedin.com/in/katherine-hu317', src: '/linkedin.webp' },
              { href: 'mailto:katherine.y.hu@gmail.com', src: '/email.png', height: '38px' },
            ].map(({ href, src, height }, i) => (
              <a key={i} href={href} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: height || '34px', borderRadius: '8px', textDecoration: 'none', transition: 'opacity 0.2s', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.opacity='0.75'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </a>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* About Me */}
      <section ref={aboutRef} className="about-section" style={{ backgroundColor: '#FFF9DC', minHeight: '100vh', padding: '120px 0 240px 10%', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'start' }}>
        <h2 className="about-heading" style={{ fontFamily: serif, fontSize: '36px', fontWeight: '700', letterSpacing: '4px', color: '#1a1a1a', margin: '0 0 60px 0', position: 'relative', zIndex: 5, opacity: aboutVisible ? 1 : 0, transform: aboutVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
          ABOUT ME
        </h2>
        <p className="about-body" style={{ fontFamily: serif, fontSize: '18px', lineHeight: '2', color: '#1a1a1a', maxWidth: '680px', margin: 0, position: 'relative', zIndex: 5, opacity: aboutVisible ? 1 : 0, transform: aboutVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s' }}>
          Hi! I'm <strong>Katherine</strong>, a computer science student at{' '}
          <span style={{ fontWeight: '700' }}>Cornell University</span>{' '}
          who enjoys building thoughtful user-focused technology &amp; exploring how software
          can create meaningful impact. I love learning new things, solving challenging problems,
          and working at the intersection of engineering, design, and creativity. Beyond coding,
          I care a lot about collaboration, leadership, and creating spaces where people can
          learn and grow together :)
        </p>
        <CorgiWalker started={corgiStarted} />
        <div className="box-container" style={{ position: 'absolute', bottom: '30px', right: '150px', width: '600px', zIndex: 2 }}>
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
                <div className={`box-tooltip${item.src.includes('lucky') ? ' bubble-lucky' : ''}`} style={{
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
                  <div className={item.src.includes('lucky') ? 'tail-lucky' : ''} style={{ position: 'absolute', width: 0, height: 0, ...item.tailStyle }} />
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
          <p style={{ fontFamily: serif, fontSize: '16px', color: '#1a1a1a', margin: 0, position: 'absolute', top: '65%', left: '360px', zIndex: 5, whiteSpace: 'nowrap' }}>{boxOpen ? 'click to close!' : 'click to open!'}</p>
          {/* Center hover/click trigger */}
          <div
            onMouseEnter={handleCenterHover}
            onClick={() => setBoxOpen(o => !o)}
            style={{ position: 'absolute', top: '30%', left: '30%', width: '40%', height: '40%', cursor: 'pointer', zIndex: 5 }}
          />
        </div>
        {/* Grass + Dither strip at bottom */}
        <div className="grass-strip" style={{ position: 'absolute', bottom: '-20px', left: 0, width: '100%', zIndex: 1 }}>
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <img
              src="/grass.png"
              alt="grass"
              style={{ width: '100%', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '55%', background: 'linear-gradient(to bottom, transparent 0%, #FFF9DC 80%)', pointerEvents: 'none', zIndex: 5, opacity: grassFade }} />
            <div style={{ position: 'absolute', top: '70%', left: 0, width: '110%', height: '30%', zIndex: 2, mixBlendMode: 'overlay', opacity: 0.12, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right, black 0%, black 50%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 40%)', WebkitMaskComposite: 'source-in', maskImage: 'linear-gradient(to right, black 0%, black 50%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 40%)', maskComposite: 'intersect' }}>
              <Dither
                waveColor={[0.5, 0.5, 0.5]}
                disableAnimation={false}
                enableMouseInteraction={false}
                mouseRadius={0.3}
                colorNum={8}
                waveAmplitude={0.5}
                waveFrequency={1.6}
                waveSpeed={0.03}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="exp-section" style={{ backgroundColor: '#FFF9DC', minHeight: '100vh', padding: '100px 0 120px 0', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'start' }}>
        <h2 className="about-heading" style={{ fontFamily: serif, fontSize: '36px', fontWeight: '700', letterSpacing: '4px', color: '#1a1a1a', textAlign: 'center', margin: '0 0 80px 0' }}>
          EXPERIENCE
        </h2>
        <div className="exp-list" style={{ maxWidth: '820px', margin: '0 auto 0 30%', padding: '0 40px', marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { img: '/meta.png',    company: 'Meta',                         role: 'Incoming Software Engineer Intern',                                        size: 360, link: 'https://www.meta.com' },
            { img: '/myovara.png', company: 'Myovara',                      role: 'Lead Mobile Engineer & Team Lead',                                          size: 280, link: 'https://tech.cornell.edu/built/myovara-labs/' },
            { img: '/hack.png',    company: 'Hack4Impact Cornell',                  role: 'Technical Lead & Software Developer',                                       size: 280, link: 'https://www.cornellh4i.org/' },
            { img: '/wicc.png',    company: 'Women in Computing at Cornell', role: 'Technical Committee Member',                                               size: 280, imgOffset: 25, link: 'https://wicc.cornell.edu/#/' },
            { img: '/cornell.png', company: 'Teaching Assistant',           role: 'CS 2112: Honors Object-Oriented Design & Data Structures',       size: 720, link: 'https://www.cs.cornell.edu/' },
          ].map(({ img, company, role, size, imgOffset = 0, link, containerAlign = 'center', containerWidth = 260, imgPosition = 'center' }, i) => (
            <div key={company} ref={expRef(i)} onMouseEnter={() => setHoveredExp(company)} onMouseLeave={() => setHoveredExp(null)} className="exp-item" style={{ display: 'flex', alignItems: 'center', gap: '0px', overflow: 'hidden', height: '100px', opacity: visibleExps[i] ? 1 : 0, transform: visibleExps[i] ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s` }}>
              <div className="exp-logo-col"
                style={{ width: `${containerWidth}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: containerAlign }}
              >
                <img src={img} alt={company} style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', objectPosition: imgPosition, marginLeft: `${imgOffset}px`, transform: hoveredExp === company ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
              </div>
              <div className="exp-text-col" style={{ marginLeft: '-60px' }}>
                {link ? (
                  <a href={link} target="_blank" rel="noreferrer" style={{ fontFamily: serif, fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0', display: 'block', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >{company}</a>
                ) : (
                  <p style={{ fontFamily: serif, fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0' }}>{company}</p>
                )}
                <p style={{ fontFamily: serif, fontSize: '15px', color: '#444', margin: 0 }}>{role}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="chars-wrapper">
          <div ref={textRef('young')} className="char-young" style={{ position: 'absolute', bottom: 0, left: '-2%', width: '700px', opacity: allExpsSeen ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}>
            <img src="/young.png" alt="young" className="person-img-jump" style={{ width: '100%', display: 'block' }} />
            <img src="/youngtext.png" alt="" style={{ position: 'absolute', top: '-16%', left: '8%', width: '55%', opacity: textVisible.young ? 1 : 0, transition: 'opacity 2.5s ease' }} />
          </div>
          <div ref={textRef('old')} className="char-old" style={{ position: 'absolute', bottom: '-40px', right: '-6%', width: '780px', opacity: allExpsSeen ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}>
            <img src="/old.png" alt="old" className="person-img" style={{ width: '100%', display: 'block' }} />
            <img src="/oldtext.png" alt="" style={{ position: 'absolute', top: '-12%', right: '8%', width: '55%', opacity: textVisible.old ? 1 : 0, transition: 'opacity 2.5s ease' }} />
          </div>
        </div>
      </section>
      {/* Projects */}
      <section className="projects-section" style={{ backgroundColor: '#FFF9DC', minHeight: '100vh', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '140px', gap: '60px', overflow: 'hidden' }}>

        <h2 className="about-heading" style={{ fontFamily: serif, fontSize: '36px', fontWeight: '700', letterSpacing: '4px', color: '#1a1a1a', margin: 0 }}>PROJECTS</h2>

        {/* Curved string with 4 blank polaroids */}
        <div className="polaroid-stage" style={{ position: 'relative', width: '100%', height: '240px' }}>
          <svg className="polaroid-string" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100px' }} viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M 0 10 Q 500 90 1000 10" stroke="#444" strokeWidth="1.5" fill="none" />
          </svg>
          {[
            { rotate: 12, polaroidOffset: 0, topOffset: 20, img: '/brandr.png', title: 'Brandr', desc: 'AI agents that scrape TikTok to audit creator content for brand compliance — built at YC × Browser Use Hackathon', link: 'https://github.com/khuhub/Brandr?tab=readme-ov-file', bottomPad: 20 },
            { rotate: -4, polaroidOffset: 0, topOffset: 0,  img: '/momentum.png', title: 'Momentum', desc: 'A Slack AI assistant that turns Slack into a command center — drafting emails, creating Notion docs, and summarizing conversations without leaving the app', link: 'https://github.com/khuhub/Momentum', bottomPad: 20 },
            { rotate: 4,  polaroidOffset: 0, topOffset: 0,  img: '/greenzone.png', title: 'Greenzone', desc: 'Data visualization tool helping Mongolian herders combat overgrazing and climate change through rangeland carrying capacity warnings', link: 'https://github.com/cornellh4i/greenzone', bottomPad: 20 },
            { rotate: -8, polaroidOffset: 0, topOffset: 20, img: '/lockedin.png', title: 'LockedIn', desc: 'Tinder for networking — swipe right to connect with people who actually want to meet you. Award-winning app built at Cornell AppDev Hack Challenge', link: 'https://github.com/akh1lk/LockedIn', bottomPad: 20 },
          ].map(({ rotate, polaroidOffset, topOffset = 0, img, title, desc, link, bottomPad = 110 }, i) => {
            const total = 4;
            const t = i / (total - 1);
            const xPositions = [17, 38, 62, 83];
            const x = xPositions[i];
            const curveY = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 90 + t * t * 10;
            return (
              <div key={i} className="polaroid-item" style={{
                position: 'absolute',
                left: `calc(${x}% - 150px)`,
                top: `${curveY - 5 + topOffset}px`,
                transform: `rotate(${(polaroidTilts[i] ?? 0) + rotate}deg)`,
                transformOrigin: 'top center',
                transition: 'transform 0.4s ease-out',
              }}
                onMouseMove={e => {
                  const prev = lastMouseX.current[i];
                  if (prev !== undefined) {
                    const delta = e.clientX - prev;
                    const tilt = Math.max(-15, Math.min(15, -delta * 0.5));
                    setPolaroidTilts(t => ({ ...t, [i]: tilt }));
                  }
                  lastMouseX.current[i] = e.clientX;
                }}
                onMouseLeave={() => {
                  setPolaroidTilts(t => ({ ...t, [i]: 0 }));
                  lastMouseX.current[i] = undefined;
                }}
              >
                <div className="polaroid-pin" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#333', margin: '0 auto 0' }} />
                <div style={{ width: '300px', backgroundColor: 'white', padding: `14px 14px ${bottomPad}px`, boxShadow: '2px 4px 12px rgba(0,0,0,0.15)', marginTop: `${polaroidOffset}px`, overflow: 'hidden' }}>
                  {img ? <img src={img} alt="" style={{ width: '272px', height: '232px', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '272px', height: '232px', backgroundColor: '#f0ece0' }} />}
                  {title && (link ? <a href={link} target="_blank" rel="noreferrer" style={{ fontFamily: serif, fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '10px 0 2px', display: 'block', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>{title}</a> : <p style={{ fontFamily: serif, fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '10px 0 2px' }}>{title}</p>)}
                  {desc && <p style={{ fontFamily: serif, fontSize: '13px', color: '#555', margin: 0, lineHeight: 1.5 }}>{desc}</p>}
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#FFF9DC', padding: '24px 0', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <p style={{ fontFamily: serif, fontSize: '13px', color: '#888', margin: 0, letterSpacing: '1px' }}>
          made by katherine hu · 2026
        </p>
      </footer>
    </div>
  );
}

export default App;
