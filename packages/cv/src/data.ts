export type ExperienceItem = {
  company: {
    name: string;
    href: string;
  };
  role: string;
  period: string;
  description: string;
  responsibilities?: string[];
  techStack?: string[];
};

export const experiences: ExperienceItem[] = [
  {
    company: {
      name: "Evergonlabs.com",
      href: "https://evergonlabs.com",
    },
    role: "Fullstack Engineer / Tech Lead",
    period: "2024 — Present",
    description:
      "Building infrastructure for RWA tokenization on EVM blockchains, based on a proprietary data standard ERC-7208. Grew the protocol to $200 TTV while delivering an integrator API, investor panel and whitelabel solution for RWA issuers.",
    responsibilities: [
      "Architected and implemented the main client application from the ground up",
      "Built backend services and REST APIs powering investor and issuer workflows",
      "Designed a decentralized protocol and shipped a public SDK for third-party integrators",
      "Set up blockchain indexing infrastructure to track on-chain asset activity in real time",
    ],
    techStack: [
      "React",
      "Vite",
      "Tailwind",
      "wagmi",
      "TypeScript",
      "Playwright",
      "Vitest",
      "Hono.js",
      "PostgreSQL",
      "Ponder.sh",
    ],
  },

  {
    company: {
      name: "Rarible.com",
      href: "https://rarible.org",
    },
    role: "Head of Frontend",
    period: "2019 — 2024",
    description:
      "Founding engineer who built and scaled an NFT marketplace from scratch. Served as Head of Frontend, managing and scaling 2 frontend teams as the company grew to 100+ employees, reaching 100K daily active users and 60+ third-party API integrators at peak.",
    responsibilities: [
      "Designed and implemented the frontend architecture powering the core marketplace",
      "Hired, mentored, and led the frontend team through rapid company growth",
      "Integrated five blockchain ecosystems (Ethereum, Solana, Tezos, Aptos, Flow) into a unified UI",
      "Co-authored the Rarible SDK, adopted by 60+ third-party integrators",
      "Established full E2E test coverage, significantly reducing regressions across releases",
    ],
    techStack: [
      "TypeScript",
      "RxJS",
      "Express.js (BFF)",
      "Jest",
      "Playwright",
      "wagmi",
      "viem",
      "ethers.js",
      "Ethereum (EVM)",
      "Solana",
      "Tezos",
      "Aptos",
      "Flow",
    ],
  },

  {
    company: {
      name: "Sticker.Place",
      href: "https://www.facebook.com/mystickerplace/",
    },
    role: "Senior Frontend / React Native Engineer",
    period: "2018 — 2019",
    description:
      "Developed and shipped mobile applications at a product-focused studio. The flagship Glowbe app ranked Top 10 in Health & Fitness for several consecutive months, sustaining 1,000+ active paid subscribers.",
    responsibilities: [
      "Single-handedly built and shipped the Glowbe app as the sole developer",
      "Engineered a cross-platform architecture sharing code between mobile and web",
      "Built a custom animated video player with smooth playback and transitions",
      "Optimized the video streaming backend to reduce latency and buffering",
      "Implemented full E2E test coverage with Cypress to ensure release stability",
    ],
    techStack: [
      "React Native",
      "React Native Web",
      "TypeScript",
      "MobX",
      "Express.js (BFF)",
      "Cypress",
      "Observable / Publisher-Subscriber state model",
    ],
  },

  {
    company: {
      name: "Daonomic.io",
      href: "https://daonomic.io",
    },
    role: "Frontend Engineer (Web3)",
    period: "2017 — 2018",
    description:
      "Built a platform for launching ICOs on Ethereum, facilitating over $20M in total funds raised across hosted projects.",
    responsibilities: [
      "Architected the client-side Web3 layer handling wallet connections and transaction signing",
      "Integrated IPFS for decentralized content storage and embedded wallet flows",
      "Built token sale dashboards giving issuers real-time visibility into fundraising progress",
    ],
    techStack: ["React", "CSS Modules", "web3.js", "Webpack", "Express.js (BFF)", "MetaMask"],
  },

  {
    company: {
      name: "Levelup.worlds",
      href: "https://levelup.worlds",
    },
    role: "Tech Lead / Fullstack Engineer",
    period: "2015 — 2017",
    description:
      "Developed an online education platform for building courses, presentations, and live streams, reaching 1,000 daily active users at peak.",
    responsibilities: [
      "Built interactive presentation editors using React and Canvas",
      "Implemented live streaming pipeline with WebRTC, WebSockets, and FFmpeg",
      "Developed content monetization features enabling creators to earn from courses",
      "Designed scalable cloud architecture on AWS to handle growing user traffic",
    ],
    techStack: ["Next.js", "React", "MongoDB", "Express.js", "AWS (Lambda, S3, media servers)"],
  },

  {
    company: {
      name: "Freelance",
      href: "/meme.jpg",
    },
    role: "Web Developer",
    period: "2014 — 2015",
    description: "Started my professional career in web development.",
    responsibilities: [
      "Built PHP-based websites and e-commerce solutions for local clients",
      "Designed UI layouts and implemented them end-to-end",
      "Collaborated in a small team, picking up core development workflows and version control",
    ],
    techStack: ["PHP, mysql, html, css, javascript"],
  },
];

export const skills = {
  frontend:
    "TypeScript, React, Next.js, Remix, React Router, Vite, RxJS, MobX, React Native, Tailwind, CSS Modules, Canvas, WebSockets, WebRTC, Playwright, Cypress, Webpack",
  dapps:
    "EVM (Ethereum), Solana, Tezos, Aptos, Flow, wagmi, viem, ethers.js, web3.js, Smart contract integrations, Blockchain indexers (ponder.sh, graph), IPFS",
  backend:
    "Node.js, Prisma, Drizzle, Express.js, Hono.js, Deno, SSR, Backend-for-Frontend, PostgreSQL, MongoDB, WebSockets, media streaming, REST API design, GraphQL, tRPC",
  infrastructure:
    "Railway, Supabase, AWS (Lambda, S3, media processing), FFmpeg, Jest, Vitest, CI/CD pipelines, Docker, Open-source SDK development",
};
