import { useState, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import './App.css';
import HeroIntro from './HeroIntro';
import Hero from './Hero';
import About from './About';

const serif = 'Lora, Georgia, serif';


const POLAROID_CARD_WIDTH = 300;
const POLAROID_IMAGE = { width: 272, height: 232 };
const POLAROID_CARD_MIN_HEIGHT = 380;
const POLAROID_WIRE_GAP = 85;
const POLAROID_STAGE_HEIGHT = POLAROID_CARD_MIN_HEIGHT + 180;
const POLAROID_TITLE_GAP = 72;

const POLAROID_X_POSITIONS = {
  4: [17, 38, 62, 83],
  3: [29, 50, 71],
};

function wireYAtX(xPercent) {
  const t = xPercent / 100;
  return (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 90 + t * t * 10;
}

const projectRows = [
  [
    { rotate: 12, polaroidOffset: 0, topOffset: 20, img: '/brandr.png', title: 'Brandr', desc: 'AI agents that scrape TikTok to audit creator content for brand compliance — built at YC × Browser Use Hackathon', link: 'https://github.com/khuhub/Brandr?tab=readme-ov-file', bottomPad: 20 },
    { rotate: -4, polaroidOffset: 0, topOffset: 0,  img: '/momentum.png', title: 'Momentum', desc: 'A Slack AI assistant that turns Slack into a command center — drafting emails, creating Notion docs, and summarizing conversations without leaving the app', link: 'https://github.com/khuhub/Momentum', bottomPad: 20 },
    { rotate: 4,  polaroidOffset: 0, topOffset: 0,  img: '/greenzone.png', title: 'Greenzone', desc: 'Data visualization tool helping Mongolian herders combat overgrazing and climate change through rangeland carrying capacity warnings', link: 'https://github.com/cornellh4i/greenzone', bottomPad: 20 },
    { rotate: -8, polaroidOffset: 0, topOffset: 20, img: '/lockedin.png', title: 'LockedIn', desc: 'Tinder for networking — swipe right to connect with people who actually want to meet you. Award-winning app built at Cornell AppDev Hack Challenge', link: 'https://github.com/akh1lk/LockedIn', bottomPad: 20 },
  ],
  [
    { rotate: 12, polaroidOffset: 0, topOffset: 0, img: '/escalate.png', title: 'Escalate', desc: 'An adaptive AI loop that runs engineering tasks through increasingly capable models, evaluates each attempt, and carries learned feedback forward to make every iteration smarter and more reliable.', link: 'https://github.com/khuhub/cursor-escalate', bottomPad: 20 },
    { rotate: 4,  polaroidOffset: 0, topOffset: 0,  img: '/patchtst.png', title: 'PatchTST', desc: 'A deep learning reimplementation of PatchTST, a transformer architecture that uses patching and channel independence for long-term time-series forecasting. The project reproduced the original paper\'s results across multiple datasets within a 1–3% margin while exploring cross-channel and multiscale variants.', link: 'https://github.com/mmichellezhou/patchtst', bottomPad: 20 },
    { rotate: -8, polaroidOffset: 0, topOffset: 0,  img: '/traceback.png', title: 'Traceback', desc: 'An award-winning project at the YC RSI/RL Hackathon, this adversarial evaluation loop forks critical agent states, uncovers hidden reward hacks, and turns each exploit into a regression test before shipping a verified fix.', link: 'https://github.com/ashtonchew/traceback', bottomPad: 20 },
  ],
];



function App() {


  const [hoveredExp, setHoveredExp] = useState(null);
  const [polaroidTilts, setPolaroidTilts] = useState({});
  const lastMouseX = useRef({});
  const [visibleExps, setVisibleExps] = useState({});
  const [seenExps, setSeenExps] = useState({});
  const [textVisible, setTextVisible] = useState({ young: false, old: false });

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

  return (
    <div>
      <HeroIntro />
      <Hero />

      <About />

      {/* Experience */}
      <section className="exp-section" style={{ minHeight: '100vh', padding: '100px 0 120px 0', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'start' }}>
        <h2 className="about-heading" style={{ fontFamily: serif, fontSize: '36px', fontWeight: '700', letterSpacing: '4px', color: '#1a1a1a', textAlign: 'center', margin: '0 0 80px 0' }}>
          EXPERIENCE
        </h2>
        <div className="exp-content" style={{ margin: '0 auto 0 calc(50% - 360px)', maxWidth: '820px', padding: '0 40px' }}>
        <div className="exp-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '40px' }}>
          {[
            { img: '/meta.png',    company: 'Meta',                         role: 'Software Engineer Intern: Ads AI Training Infra',                            size: 360, link: 'https://www.meta.com' },
            { img: '/myovara.png', company: 'Myovara',                      role: 'Lead Mobile Engineer & Team Lead',                                          size: 280, link: 'https://tech.cornell.edu/built/myovara-labs/' },
            { img: '/hack.png',    company: 'Hack4Impact Cornell',                  role: 'Technical Lead & Software Developer',                                       size: 280, link: 'https://www.cornellh4i.org/' },
            { img: '/wicc.png',    company: 'Women in Computing at Cornell', role: 'Technical Committee Member',                                               size: 280, imgOffset: 25, link: 'https://wicc.cornell.edu/#/' },
            { img: '/cornell.png', company: 'Teaching Assistant',           role: 'CS 2112: Honors Object-Oriented Design & Data Structures',       size: 720, link: 'https://www.cs.cornell.edu/' },
          ].map(({ img, company, role, imgOffset = 0, link, containerAlign = 'center', containerWidth = 260, imgPosition = 'center' }, i) => (
            <div key={company} ref={expRef(i)} onMouseEnter={() => setHoveredExp(company)} onMouseLeave={() => setHoveredExp(null)} className="exp-item" style={{ display: 'flex', alignItems: 'center', gap: '0px', overflow: 'hidden', height: '100px', opacity: visibleExps[i] ? 1 : 0, transform: visibleExps[i] ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s` }}>
              <div className="exp-logo-col"
                style={{ width: `${containerWidth}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: containerAlign }}
              >
                <img src={img} alt={company} className="w-full h-full object-contain block" style={{ objectPosition: imgPosition, marginLeft: `${imgOffset}px`, transform: hoveredExp === company ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
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
        </div>
        <div className="chars-wrapper">
          <div ref={textRef('young')} className="char-young" style={{ position: 'absolute', bottom: 0, left: '-2%', width: '700px', opacity: allExpsSeen ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}>
            <div style={{ position: 'relative' }}>
              <img src="/youngtext.png" alt="" style={{ position: 'absolute', bottom: '72%', left: '22%', width: '45%', opacity: textVisible.young ? 1 : 0, transition: 'opacity 2.5s ease' }} />
              <img src="/young.png" alt="young" className="person-img-jump w-full h-auto block" />
            </div>
          </div>
          <div ref={textRef('old')} className="char-old" style={{ position: 'absolute', bottom: '-40px', right: '-6%', width: '780px', opacity: allExpsSeen ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}>
            <div style={{ position: 'relative' }}>
              <img src="/oldtext.png" alt="" style={{ position: 'absolute', bottom: '67%', right: '22%', width: '45%', opacity: textVisible.old ? 1 : 0, transition: 'opacity 2.5s ease' }} />
              <img src="/old.png" alt="old" className="person-img w-full h-auto block" />
            </div>
          </div>
        </div>
      </section>
      {/* Projects */}
      <section className="projects-section" style={{ minHeight: '100vh', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '108px', paddingBottom: '160px', gap: 0, overflow: 'visible' }}>

        <h2 className="about-heading" style={{ fontFamily: serif, fontSize: '36px', fontWeight: '700', letterSpacing: '4px', color: '#1a1a1a', margin: 0 }}>PROJECTS</h2>

        {projectRows.map((projects, rowIndex) => (
          <div
            key={rowIndex}
            className="polaroid-stage"
            style={{
              position: 'relative',
              width: '100%',
              height: `${POLAROID_STAGE_HEIGHT}px`,
              marginTop: rowIndex > 0 ? `${POLAROID_WIRE_GAP}px` : `${POLAROID_TITLE_GAP}px`,
            }}
          >
            <svg className="polaroid-string" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100px' }} viewBox="0 0 1000 100" preserveAspectRatio="none">
              <path d="M 0 10 Q 500 90 1000 10" stroke="#444" strokeWidth="1.5" fill="none" />
            </svg>
            {projects.map(({ rotate, polaroidOffset, topOffset = 0, img, title, desc, link, bottomPad = 110 }, i) => {
              const tiltKey = `${rowIndex}-${i}`;
              const total = projects.length;
              const xPositions = POLAROID_X_POSITIONS[total] ?? POLAROID_X_POSITIONS[4];
              const x = xPositions[i];
              const curveY = wireYAtX(x);
              return (
                <div key={tiltKey} className="polaroid-item" style={{
                  position: 'absolute',
                  left: `calc(${x}% - 150px)`,
                  top: `${curveY - 5}px`,
                  transform: `rotate(${(polaroidTilts[tiltKey] ?? 0) + rotate}deg)`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.4s ease-out',
                }}
                  onMouseMove={e => {
                    const prev = lastMouseX.current[tiltKey];
                    if (prev !== undefined) {
                      const delta = e.clientX - prev;
                      const tilt = Math.max(-15, Math.min(15, -delta * 0.5));
                      setPolaroidTilts(t => ({ ...t, [tiltKey]: tilt }));
                    }
                    lastMouseX.current[tiltKey] = e.clientX;
                  }}
                  onMouseLeave={() => {
                    setPolaroidTilts(t => ({ ...t, [tiltKey]: 0 }));
                    lastMouseX.current[tiltKey] = undefined;
                  }}
                >
                  <div className="polaroid-pin" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#333', margin: '0 auto 0' }} />
                  <div className="polaroid-card" style={{ width: `${POLAROID_CARD_WIDTH}px`, minHeight: `${POLAROID_CARD_MIN_HEIGHT}px`, backgroundColor: 'white', padding: `14px 14px ${bottomPad}px`, boxShadow: '2px 4px 12px rgba(0,0,0,0.15)', marginTop: `${polaroidOffset}px`, overflow: 'hidden', boxSizing: 'border-box' }}>
                    {img ? <img src={img} alt={title || ''} style={{ width: `${POLAROID_IMAGE.width}px`, height: `${POLAROID_IMAGE.height}px`, objectFit: 'cover', display: 'block' }} /> : <div style={{ width: `${POLAROID_IMAGE.width}px`, height: `${POLAROID_IMAGE.height}px`, backgroundColor: '#f0ece0' }} />}
                    {title ? (link ? <a href={link} target="_blank" rel="noreferrer" style={{ fontFamily: serif, fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '10px 0 2px', display: 'block', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>{title}</a> : <p style={{ fontFamily: serif, fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '10px 0 2px' }}>{title}</p>) : <div style={{ height: '22px', margin: '10px 0 2px' }} aria-hidden="true" />}
                    {desc ? <p style={{ fontFamily: serif, fontSize: '13px', color: '#555', margin: 0, lineHeight: 1.5 }}>{desc}</p> : <div style={{ minHeight: '78px' }} aria-hidden="true" />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 0', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <p style={{ fontFamily: serif, fontSize: '13px', color: '#888', margin: 0, letterSpacing: '1px' }}>
          made by katherine hu · 2026
        </p>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
