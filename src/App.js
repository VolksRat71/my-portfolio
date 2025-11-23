// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { portfolioData } from './contentData';
import { User, Briefcase, Code, Terminal, Mail, Linkedin, Github } from 'lucide-react';
import TypingEffect from './TypingEffect';
import TerminalComponent from './TerminalComponent';
import SplashScreen from './SplashScreen';
import { audioSynth } from './AudioSynth';

// Helper Components to render specific JSON data
const ProfileView = ({ data }) => (
  <div className="animate-fade-in">
    <h2 className="section-title"> > cat profile.json</h2>
    {data.heroUrl && (
      <div className="hero-container">
        <img src={data.heroUrl} alt="Hero" className="hero-img" />
      </div>
    )}
    <div className="content-card">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <img src={data.avatarUrl} alt="Profile" className="profile-img" />
        <div>
          <h1>{data.name}</h1>
          <h3>{data.role}</h3>
        </div>
      </div>
      <p>"{data.tagline}"</p>
      <hr style={{ borderColor: '#332200', margin: '1rem 0' }}/>
      <p>{data.bio}</p>
      <div style={{ marginTop: '1rem' }}>
        <p>Location: {data.location}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <a href={data.social.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
            <Linkedin size={20} />
            <span>LinkedIn</span>
          </a>
          <a href={data.social.github} target="_blank" rel="noopener noreferrer" className="social-link">
            <Github size={20} />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  </div>
);

const ExperienceView = ({ data }) => (
  <div className="animate-fade-in">
    <h2 className="section-title"> > ls ./experience</h2>
    {data.map((job, index) => (
      <div key={index} className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h2 style={{ color: '#ffb000' }}>{job.company}</h2>
          <span style={{ color: '#9e6a00' }}>[{job.period}]</span>
        </div>
        <h3>// {job.role}</h3>
        <ul>
          {job.details.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const ProjectsView = ({ data }) => (
  <div className="animate-fade-in">
    <h2 className="section-title"> > git log --oneline</h2>
    {data.map((project, index) => (
      <div key={index} className="content-card">
        <h2>{project.title}</h2>
        <div style={{ margin: '0.5rem 0' }}>
          {project.tech.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <p>{project.description}</p>
      </div>
    ))}
  </div>
);

const ContactView = ({ data }) => (
  <div className="animate-fade-in">
    <h2 className="section-title"> > cat contact.txt</h2>
    <div className="content-card">
      <h2>Get In Touch</h2>
      <hr style={{ borderColor: '#332200', margin: '1rem 0' }}/>
      <div style={{ marginBottom: '1.5rem' }}>
        <p><strong>Name:</strong> {data.name}</p>
        <p><strong>Role:</strong> {data.role}</p>
        <p><strong>Location:</strong> {data.location}</p>
      </div>
      <h3 style={{ marginBottom: '1rem', color: '#ffb000' }}>Connect With Me</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a href={data.social.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
          <Linkedin size={20} />
          <span>LinkedIn - Connect professionally</span>
        </a>
        <a href={data.social.github} target="_blank" rel="noopener noreferrer" className="social-link">
          <Github size={20} />
          <span>GitHub - Check out my code</span>
        </a>
        <a href={`mailto:${data.social.email}`} className="social-link">
          <Mail size={20} />
          <span>Email - {data.social.email}</span>
        </a>
      </div>
    </div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [bootState, setBootState] = useState('turning-on'); // 'off', 'turning-on', 'booting', 'on'
  const bootPhaseActive = useRef(true); // Track if we're still in the boot phase

  // Initialize audio once on mount
  useEffect(() => {
    audioSynth.init();
    // Resume the audio context (required by browsers)
    audioSynth.resume();
    // Play boot sound immediately (only if boot phase is active)
    if (bootPhaseActive.current) {
      audioSynth.playTurnOn();
    }
  }, []);

  // Boot sequence timing
  useEffect(() => {
    if (bootState === 'turning-on') {
      const timer = setTimeout(() => {
        setBootState('booting');
      }, 1500); // Match turnOn animation duration
      return () => clearTimeout(timer);
    }
    // Mark boot phase as complete when we reach 'on' state
    if (bootState === 'on') {
      bootPhaseActive.current = false;
      audioSynth.disableBootSound(); // Prevent boot sound from playing after boot
    }
  }, [bootState]);

  const renderContent = () => {
    switch(activeTab) {
      case 'profile': return <ProfileView data={portfolioData.profile} />;
      case 'experience': return <ExperienceView data={portfolioData.experience} />;
      case 'projects': return <ProjectsView data={portfolioData.projects} />;
      case 'contact': return <ContactView data={portfolioData.profile} />;
      default: return <ProfileView data={portfolioData.profile} />;
    }
  };

  const handleCloseTerminal = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setIsTerminalOpen(false);
      setIsClosing(false);
    }
  };

  const handleReboot = () => {
    audioSynth.playTurnOff();
    setBootState('off');
    setIsTerminalOpen(false);
    setTimeout(() => {
      setBootState('turning-on');
      audioSynth.enableBootSound();
      audioSynth.playTurnOn();
    }, 1000); // Wait for turn-off animation
  };

  const handleBootComplete = () => {
    setBootState('on');
  };

  const toggleTerminal = () => {
    if (isTerminalOpen || isClosing) {
      handleCloseTerminal();
    } else {
      setIsTerminalOpen(true);
    }
  };

  // Keyboard shortcuts to toggle terminal
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + ` (backtick) - VS Code style
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }
      // Ctrl + Alt + T - Linux style
      else if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        toggleTerminal();
      }
      // Ctrl + Shift + T - Common terminal shortcut
      else if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTerminal();
      }
      // Cmd + ` (backtick) - macOS VS Code style
      else if (e.metaKey && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTerminalOpen, isClosing]);

  return (
    <>
      {/* Black background for off state */}
      {bootState === 'off' && <div className="crt-off"></div>}

      {/* Main CRT Container - handles turn on/off animations */}
      <div
        className={`crt-container ${bootState === 'off' ? 'crt-turn-off' : (bootState === 'turning-on' ? 'crt-turn-on' : '')}`}
      >

        {/* Content Switching */}
        {bootState === 'booting' ? (
          <SplashScreen onComplete={handleBootComplete} />
        ) : bootState === 'turning-on' ? (
          null
        ) : (
          <div className={`app-content ${bootState === 'on' ? 'fade-in' : ''}`}>
            <div className="scanline"></div>
            <div className="crt-flicker"></div>

            {/* Sidebar Navigation */}
            <nav className="sidebar">
              <div className="profile-section">
                <Terminal size={40} color="#ffb000" />
                <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>{portfolioData.profile.name.split(' ')[0].toUpperCase()}_PORTFOLIO_V1</div>
              </div>

              <div className="nav-menu">
                <button
                  className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User size={18} />
                  <span>profile.json</span>
                </button>

                <button
                  className={`nav-item ${activeTab === 'experience' ? 'active' : ''}`}
                  onClick={() => setActiveTab('experience')}
                >
                  <Briefcase size={18} />
                  <span>experience.md</span>
                </button>

                <button
                  className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
                  onClick={() => setActiveTab('projects')}
                >
                  <Code size={18} />
                  <span>projects.js</span>
                </button>

                <button
                  className={`nav-item ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contact')}
                >
                  <Mail size={18} />
                  <span>contact.txt</span>
                </button>
              </div>
            </nav>

            {/* Main Content Area */}
            <main className="main-content">
              <div className="header-bar">
                 root@nathaniel:~/portfolio/{activeTab} -- -bash
              </div>
              {renderContent()}

              {/* Terminal Toggle Button */}
              {(!isTerminalOpen || isClosing) && (
                <button
                  className="terminal-toggle-btn"
                  onClick={() => setIsTerminalOpen(true)}
                >
                  <Terminal size={20} />
                  <span>_TERMINAL</span>
                </button>
              )}

              {/* Terminal Overlay */}
              {isTerminalOpen && (
                <TerminalComponent
                  onNavigate={setActiveTab}
                  activeTab={activeTab}
                  onClose={handleCloseTerminal}
                  isClosing={isClosing}
                  onAnimationEnd={handleAnimationEnd}
                  onReboot={handleReboot}
                />
              )}
            </main>
          </div>
        )}
      </div>
    </>
  );
}

export default App;

