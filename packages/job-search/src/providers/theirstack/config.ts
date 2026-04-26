export const DAYS_BACK = 30;

export const PAGES_TO_FETCH = 2;

export const SENIORITY_LEVELS = ["senior", "staff", "c_level"];

export const JOB_TITLES = [
  "Founding Engineer",
  "Tech Lead",
  "Engineering Lead",
  "Lead Engineer",
  "Lead Frontend Engineer",
  "Staff Engineer",
  "Staff Frontend Engineer",
  "Principal Engineer",
  "Senior Frontend Engineer",
  "Senior Front-End Engineer",
  "Senior Fullstack Engineer",
  "Senior Full-Stack Engineer",
  "Senior Full Stack Engineer",
  "Senior Web3 Engineer",
  "Senior Software Engineer",
];

export const TECH_SLUGS = ["typescript", "react", "next-js", "node-js", "ethereum", "ethers-js", "wagmi", "viem"];

// Titles that explicitly name a stack/language not in the candidate's profile
export const EXCLUDED_TITLE_PATTERNS = [
  "Rust",
  "\\.NET",
  "Golang",
  " Go ",
  "Solidity",
  "Python",
  "Java ",
  "C\\+\\+",
  "Ruby",
  "PHP",
];

// Domains that are irrelevant to the candidate regardless of title or stack
export const EXCLUDED_DESCRIPTION_PATTERNS = [
  "defense contractor",
  "defence contractor",
  "Department of Defense",
  "DoD",
  "military",
  "drone",
  "unmanned aerial",
  "swarm robot",
  "aircraft",
  "EuroDrone",
];

export const DESCRIPTION_KEYWORDS = [
  "DeFi",
  "web3",
  "on-chain",
  "smart contract",
  "Ethereum",
  "EVM",
  "RWA",
  "tokenization",
  "dApp",
  "protocol",
  "wagmi",
  "viem",
  "ethers",
];
