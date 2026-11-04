import { Analytics } from '@vercel/analytics/react';
import './App.css';
import HeroIntro from './HeroIntro';
import Hero from './Hero';
import About from './About';
import Experience from './Experience';
import Projects from './Projects';

const serif = 'Lora, Georgia, serif';


function App() {


  return (
    <div>
      <HeroIntro />
      <Hero />

      <About />

      <Experience />

      <Projects />

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
