// src/contentData.js

export const portfolioData = {
  profile: {
    name: "Nathaniel Ryan",
    role: "Sr. Software Engineer",
    tagline: "Builder of Fast Cars and Not Fast Vans",
    location: "Austin, Texas",
    bio: "Full Stack Engineer specialized in AWS and Google Cloud Computing. I build high-impact software, from rendering systems for major streaming platforms to intricate business handlers.",
    social: {
      linkedin: "https://linkedin.com/in/yourprofile",
      github: "https://github.com/yourprofile"
    },
    avatarUrl: "/api/placeholder/150/150" // Replace with your actual PFP
  },
  experience: [
    {
      company: "KERV Interactive",
      role: "Senior Software Engineer",
      period: "Jul 2022 - Present",
      details: [
        "Lead development of high-impact software engineering projects using advanced project management.",
        "Enhance communication across technology teams to ensure smooth project execution.",
        "Excel in solving complex technical problems by breaking them down into manageable components."
      ]
    },
    {
      company: "Nerd Power",
      role: "Software Engineer",
      period: "Apr 2021 - Oct 2022",
      details: [
        "Developed business applications via Next.js/Material-UI and AWS Lambda/MongoDB.",
        "Managed tasks independently via Kanban board."
      ]
    },
    {
      company: "Trilogy Education",
      role: "Teaching Assistant & Learning Assistant",
      period: "Mar 2020 - Aug 2022",
      details: [
        "Provided technical support for full-stack web development students at UC Berkeley.",
        "Assisted over 5,000 university students across the US, UK, and Australia."
      ]
    }
  ],
  projects: [
    {
      title: "Warner Bros. Discovery Ad System",
      tech: ["Rendering Engine", "AWS", "Scale"],
      description: "Lead engineering efforts on the rendering system powering video ads for streaming platforms. Capable of creating thousands of custom videos daily. Featured at the Theater at Madison Square Garden during Upfront 2025."
    },
    {
      title: "Terminal Portfolio",
      tech: ["React", "JSON", "CSS"],
      description: "A responsive, data-driven personal portfolio styled like a retro IDE."
    }
  ]
};
