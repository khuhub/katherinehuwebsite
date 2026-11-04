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
      <Hero />

      <About />

      <Experience />

      <Projects />

      <Footer />

      <Analytics />
    </div>
  );
}

export default App;
