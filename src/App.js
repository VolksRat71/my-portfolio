// src/App.js
import React, { useState } from 'react';
import './App.css';
import { portfolioData } from './contentData';
import { User, Briefcase, Code, Terminal, Mail } from 'lucide-react';
import TypingEffect from './TypingEffect';
import TerminalComponent from './TerminalComponent';

// Helper Components to render specific JSON data
const ProfileView = ({ data }) => (
  <div className="animate-fade-in">
    <h2 className="section-title"> > cat profile.json</h2>
    <div className="content-card">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <img src={data.avatarUrl} alt="Profile" className="profile-img" />
        <div>
          <h1><TypingEffect text={data.name} speed={100} /></h1>
          <h3>{data.role}</h3>
        </div>
      </div>
      <p>"{data.tagline}"</p>
      <hr style={{ borderColor: '#332200', margin: '1rem 0' }}/>
      <p>{data.bio}</p>
      <div style={{ marginTop: '1rem' }}>
        <p>Location: {data.location}</p>
        <p>Connect: <a href={data.social.linkedin} style={{color: '#ffb000'}}>LinkedIn</a></p>
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

function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const renderContent = () => {
    switch(activeTab) {
      case 'profile': return <ProfileView data={portfolioData.profile} />;
      case 'experience': return <ExperienceView data={portfolioData.experience} />;
      case 'projects': return <ProjectsView data={portfolioData.projects} />;
      default: return <ProfileView data={portfolioData.profile} />;
    }
  };

  return (
    <div className="app-container">
      <div className="scanline"></div>
      <div className="crt-flicker"></div>

      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="profile-section">
          <Terminal size={40} color="#ffb000" />
          <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>DEV_PORTFOLIO_V1</div>
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
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="header-bar">
           root@nathaniel:~/portfolio/{activeTab} -- -bash
        </div>
        {renderContent()}

        {/* Terminal Toggle Button */}
        {!isTerminalOpen && (
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
            onClose={() => setIsTerminalOpen(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
