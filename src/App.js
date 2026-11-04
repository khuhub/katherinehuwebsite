import { Analytics } from '@vercel/analytics/react';
import './App.css';
import HeroIntro from './HeroIntro';
import Hero from './Hero';
import About from './About';
import Experience from './Experience';
import Projects from './Projects';
import Footer from './Footer';


function App() {


  return (
    <div>
      <HeroIntro />
      {/* the panels sit above the footer, which is pinned behind them: the last one scrolls up to uncover it */}
      <div className="page">
        <Hero />
        <About />
        <Experience />
        <Projects />
      </div>
      <Footer />

      <Analytics />
    </div>
  );
}

export default App;
