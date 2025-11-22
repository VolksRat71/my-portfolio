// src/contentData.js

export const portfolioData = {
  profile: {
    name: "Nate Ryan",
    role: "Sr. Software Engineer",
    tagline: "Builder of Fast Cars and Not Fast Vans",
    location: "Austin, Texas",
    bio: "Full Stack Engineer specialized in AWS and Google Cloud Computing. I build high-impact software, from rendering systems for major streaming platforms to intricate business handlers.",
    social: {
      linkedin: "https://www.linkedin.com/in/nathanieljryan",
      github: "https://github.com/VolksRat71",
      email: "nathanieljryan1994@gmail.com"
    },
    avatarUrl: `${process.env.PUBLIC_URL}/pfp.jpeg`,
    heroUrl: `${process.env.PUBLIC_URL}/hero.jpeg`
  },
  experience: [
    {
      company: "KERV Interactive",
      role: "Senior Software Engineer",
      period: "Jul 2022 - Present · 3 yrs 5 mos",
      location: "Austin, Texas Metropolitan Area",
      employmentType: "Full-time",
      details: [
        "Lead the development and delivery of high-impact software engineering projects, utilizing advanced project management and prioritization skills to efficiently handle multiple tasks and deadlines",
        "Enhance communication and collaboration across various technology teams and departments, ensuring smooth project execution and contributing to a cohesive organizational culture",
        "Excel in solving complex technical problems, employing a methodical approach to break down challenges into manageable components, resulting in effective and innovative solutions",
        "Proactively seek and apply feedback for continuous professional development, staying abreast of technological advancements and contributing to team success through knowledge sharing, colleague support, and newcomer integration"
      ]
    },
    {
      company: "Nerd Power",
      role: "Software Engineer",
      period: "Apr 2021 - Oct 2022 · 1 yr 7 mos",
      location: "Gilbert, Arizona, United States",
      employmentType: "Contract",
      details: [
        "Develop business applications/handlers via Next.js/Material-UI Client & AWS Lambda Microservice/MongoDB Mongoose ORM server-side",
        "Complete tasks and achieve goals independently, assigned via Kanban board",
        "Develop features and services as described by product owners, executives, directors, sales personnel, through descriptions given on Slack, E-Meeting, Email, etc."
      ]
    },
    {
      company: "Trilogy Education",
      role: "Multiple Roles",
      period: "Feb 2020 - Aug 2022 · 2 yrs 7 mos",
      employmentType: "Part-time",
      details: [
        "Learning Assistant (Mar 2020 - Aug 2022): Utilized Beta Slack support application (Trilobot) to provide written technical and conceptual responses to student inquiries. Assisted students over video call to ensure ticket resolution",
        "Collaborated with team members remotely to provide web development support to 5,000+ university students across the United States, UK, and Australia",
        "Teaching Assistant at UC Berkeley (Dec 2020 - Jul 2021): Provided support and guidance to students attending University of California Full-Stack Web Development program",
        "Reinforced lesson material presented by the lead instructor by helping students with questions and reviewing material one-on-one or in small groups",
        "Led class reviews, discussions, and whiteboarding challenges to ensure students gain employer competitive skills",
        "Maintained professional relationships with students and instructional staff at UC Berkeley for full-stack web development cohort",
        "Provided feedback to curriculum development and technical support teams to improve classroom experience for students and staff",
        "Substitute Teaching Assistant at University of Oregon (Feb 2020 - Mar 2020)"
      ]
    }
  ],
  projects: [
    {
      title: "Dynamic Video Rendering System for Warner Bros. Discovery",
      tech: ["AWS Lambda", "Step Functions", "FFmpeg", "Puppeteer", "MediaConvert", "S3", "DynamoDB"],
      description: "Lead engineering efforts on a serverless rendering pipeline powering contextually-aware video ads for streaming platforms like Max, Discovery+, and Food Network. The system analyzes TV episode content and dynamically generates thousands of personalized video ads daily, matching products from brand catalogs to what viewers just watched. Featured at The Theater at Madison Square Garden during Warner Bros. Discovery's 2025 Upfront event.",
      highlights: [
        "Architected serverless pipeline using AWS Step Functions orchestrating 10+ Lambda functions",
        "Implemented browser-based animation rendering with Puppeteer for 9 different animation types",
        "Designed scalable system capable of generating millions of custom videos with sub-minute processing time",
        "Built intelligent asset management system handling dynamic overlays, QR codes, and multi-format transcoding",
        "Integrated with visual recognition AI to match episode content with product catalog items"
      ]
    },
    {
      title: "Radius Creative Platform - Internal Video Production System",
      tech: ["Node.js", "React", "AWS Lambda", "MySQL", "S3"],
      description: "Full-featured web application enabling KERV's Creative Strategy Team to produce interactive video advertisements. Provides intuitive interface for template selection, asset management, and real-time video generation with all 9 animation types, custom styling, and QR code integration.",
      highlights: [
        "Built React-based UI with Material-UI for streamlined creative workflow",
        "Developed Koa.js backend API with MySQL database integration",
        "Implemented real-time job status tracking and asset preview system"
      ]
    },
    {
      title: "Geo-Targeted QR Code Redirect System",
      tech: ["CloudFront Functions", "Lambda@Edge", "DynamoDB Global Tables", "SQS", "CloudFront KeyValueStore"],
      description: "Ultra-fast serverless redirect service with two-tier edge caching delivering sub-5ms redirects globally. Implements intelligent geo-targeting to dynamically route users to location-specific destinations based on ZIP codes, with progressive fallback matching and traffic-dependent caching strategy.",
      highlights: [
        "Architected two-tier caching: CloudFront Function (<5ms) → Lambda@Edge + DynamoDB (~50ms)",
        "Implemented CloudFront KeyValueStore with traffic-dependent caching (90% hit rate after warm-up)",
        "Designed progressive ZIP code matching algorithm reducing storage from 42K to hundreds of records",
        "Built DynamoDB Global Tables with 4-region US replication for low-latency edge reads",
        "Developed fire-and-forget pixel tracking system with SQS queuing and idempotency guarantees"
      ]
    }
  ]
};
