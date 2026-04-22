import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { experiences, skills } from "./data";

Font.register({
  family: "BBH Bartle",
  src: "https://fonts.gstatic.com/s/bbhbartle/v1/zYXjKVYuMYMaN-IMqP3RSm4.ttf",
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
      fontWeight: 700,
    },
  ],
});

const colors = {
  primary: "#373fb0",
  text: "#1a1a1a",
  textMuted: "#555555",
  border: "#d4d4d4",
  sectionLine: "#0033ff",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    color: colors.text,
    padding: "36 44",
    lineHeight: 1.4,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  header: {
    flex: 1,
  },
  name: {
    fontFamily: "BBH Bartle",
    fontSize: 22,
    letterSpacing: 0.5,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.primary,
    marginTop: 16,
  },
  contactRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    fontSize: 8.5,
    color: colors.textMuted,
  },
  contactLink: {
    fontSize: 8.5,
    color: colors.primary,
    textDecoration: "none",
  },
  contactSeparator: {
    color: colors.border,
  },

  // Section headings — centered with colored underline
  sectionHeadingWrap: {
    marginTop: 14,
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Profile summary
  profileText: {
    fontSize: 9.5,
    lineHeight: 1.5,
    textAlign: "justify",
    marginBottom: 10,
  },
  bold: {
    fontWeight: 700,
  },

  // Core competencies — bullet list
  competencyItem: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 1.5,
    fontSize: 9.5,
  },

  // Skills
  skillRow: {
    flexDirection: "column",
    gap: 2,
    fontSize: 9,
    marginBottom: 6,
  },
  skillLabel: {
    fontWeight: 700,
    fontSize: 9,
  },

  // Experience
  experienceItem: {
    marginBottom: 10,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  role: {
    fontSize: 10.5,
    fontWeight: 700,
  },
  period: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  companyLine: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 3,
  },
  companyLink: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 600,
    textDecoration: "none",
  },
  companyLocation: {
    fontSize: 9,
    color: colors.textMuted,
  },
  description: {
    fontSize: 9.5,
    marginBottom: 3,
    lineHeight: 1.5,
  },
  responsibilityItem: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 1.5,
    paddingLeft: 2,
  },
  bullet: {
    fontSize: 9.5,
  },
  responsibilityText: {
    fontSize: 9.5,
    flex: 1,
    lineHeight: 1.4,
  },
  techStack: {
    fontSize: 8.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  techStackLabel: {
    fontWeight: 600,
    color: colors.textMuted,
  },

  // Circle accent
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
});

const coreCompetencies = [
  "Product design + engineering from 0 — takes an idea from blank canvas to shipped product, owning architecture, UI/UX decisions, and implementation end-to-end",
  "Strong visual design sensibility — shapes product direction as both engineer and designer, ensuring what ships is polished and trustworthy",
  "Deep Web3 expertise — EVM/Ethereum-first, fluent in DeFi protocols, tokenization standards, smart contract integrations, and on-chain infrastructure",
  "TypeScript-first, SOLID-principled — combines functional-reactive programming and pragmatic OOP to keep codebases lean and easy to extend",
  "AI-augmented development — deeply integrated AI tooling into my daily workflow, using it as a core part of how I design, write, and review code — significantly multiplying output without sacrificing quality or judgment",
];

export function CvPdfDocument() {
  return (
    <Document title="Ivan — Senior Fullstack Engineer CV" author="Ivan (Vanya2h)">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.header}>
            <Text style={s.name}>Ivan K.</Text>
            <Text style={s.subtitle}>Senior Fullstack Engineer | Tech Lead | Product Builder</Text>
          </View>
          <View style={s.circle} />
        </View>

        {/* Profile Summary */}
        <SectionHeading>Profile Summary</SectionHeading>
        <View>
          <Text style={s.profileText}>
            Senior fullstack developer and full-cycle product builder with{" "}
            <Text style={s.bold}>10+ years of experience</Text> taking apps from concept to production — shipping
            polished, maintainable systems with real users at scale. Founding engineer at startups that raised{" "}
            <Text style={s.bold}>$17M in funding</Text>. Working in <Text style={s.bold}>DeFi since 2017</Text>, with a
            primary focus on Ethereum and EVM chains.
          </Text>
          <Text style={s.profileText}>
            Built RWA tokenization infrastructure reaching <Text style={s.bold}>$200M TVL</Text> at Evergon. Founding
            engineer and Head of Frontend at Rarible (2019–2024), scaling the marketplace across 5 blockchain ecosystems
            (Solana, Aptos, Tezos, Flow, EVM) to <Text style={s.bold}>100K daily active users</Text>, co-authoring its
            SDK adopted by <Text style={s.bold}>60+ integrators</Text>.
          </Text>
          <Text style={s.profileText}>
            Delivers across the full stack: <Text style={s.bold}>SDKs</Text> and <Text style={s.bold}>APIs</Text>,
            <Text style={s.bold}>crossplatform web</Text> and <Text style={s.bold}>mobile apps</Text> (including a top
            10 App Store React Native app), <Text style={s.bold}>backend services</Text>, and{" "}
            <Text style={s.bold}>real-time systems</Text> (WebRTC, WebSockets, media streaming). Primary stack:{" "}
            <Text style={s.bold}>TypeScript</Text>, <Text style={s.bold}>React</Text>,{" "}
            <Text style={s.bold}>Node.js</Text>, <Text style={s.bold}>Next.js</Text>,{" "}
            <Text style={s.bold}>PostgreSQL</Text>.
          </Text>
        </View>

        {/* Core Competencies */}
        <SectionHeading>Core Competencies</SectionHeading>
        <View>
          {coreCompetencies.map((item, i) => (
            <View key={i} style={s.competencyItem}>
              <Text>•</Text>
              <Text>{item}</Text>
            </View>
          ))}
        </View>

        {/* Skills */}
        <SectionHeading>Skills</SectionHeading>

        <View style={s.skillRow}>
          <Text>
            <Text style={s.bold}>Languages & Frameworks:</Text> {skills.frontend}
          </Text>
        </View>
        <View style={s.skillRow}>
          <Text>
            <Text style={s.bold}>Blockchain:</Text> {skills.dapps}
          </Text>
        </View>
        <View style={s.skillRow}>
          <Text>
            <Text style={s.bold}>Backend & Infra:</Text> {skills.backend}, {skills.infrastructure}
          </Text>
        </View>

        {/* Professional Experience */}
        <SectionHeading>Professional Experience</SectionHeading>
        {experiences.map((exp) => (
          <View key={exp.company.name} style={s.experienceItem} wrap={false}>
            <View style={s.experienceHeader}>
              <Text style={s.role}>{exp.role}</Text>
              <Text style={s.period}>{exp.period}</Text>
            </View>
            <View style={s.companyLine}>
              <Link src={exp.company.href} style={s.companyLink}>
                {exp.company.name}
              </Link>
              <Text style={s.companyLocation}>- remote</Text>
            </View>
            <Text style={s.description}>{exp.description}</Text>
            {exp.responsibilities &&
              exp.responsibilities.map((item, i) => (
                <View key={i} style={s.responsibilityItem}>
                  <Text style={s.bullet}>•</Text>
                  <Text style={s.responsibilityText}>{item}</Text>
                </View>
              ))}
            {exp.techStack && exp.techStack.length > 0 && (
              <Text style={s.techStack}>
                <Text style={s.techStackLabel}>Technologies: </Text>
                {exp.techStack.join(", ")}
              </Text>
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <View style={s.sectionHeadingWrap}>
      <Text style={s.sectionHeading}>{children}</Text>
    </View>
  );
}
