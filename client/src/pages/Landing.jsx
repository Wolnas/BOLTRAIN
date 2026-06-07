import { useRef } from 'react';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import RegisterSection from '../components/RegisterSection';
import LoginSection from '../components/LoginSection';

export default function Landing() {
  const registroRef = useRef(null);
  const loginRef = useRef(null);

  const scrollToRegister = () => {
    document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLogin = () => {
    document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <HeroSection
        onScrollToLogin={scrollToLogin}
        onScrollToRegister={scrollToRegister}
      />
      <AboutSection />
      <div ref={registroRef}>
        <RegisterSection onScrollToLogin={scrollToLogin} />
      </div>
      <div ref={loginRef}>
        <LoginSection onScrollToRegister={scrollToRegister} />
      </div>
    </main>
  );
}
