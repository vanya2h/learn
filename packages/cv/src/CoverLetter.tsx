import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

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
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10.5,
    color: colors.text,
    padding: "52 60",
    lineHeight: 1.6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  name: {
    fontFamily: "BBH Bartle",
    fontSize: 22,
    letterSpacing: 0.5,
    color: colors.primary,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  meta: {
    marginBottom: 28,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: colors.textMuted,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 28,
  },
  greeting: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 18,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.7,
    marginBottom: 16,
    textAlign: "justify",
  },
  closing: {
    marginTop: 28,
    fontSize: 10.5,
  },
  signature: {
    fontFamily: "BBH Bartle",
    fontSize: 18,
    color: colors.primary,
    marginTop: 6,
  },
});

export function CoverLetterOnramperPdf() {
  return (
    <Document title="Ivan K. — Cover Letter — Onramper" author="Ivan K.">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.circle} />
        </View>

        {/* Meta */}
        <View style={s.meta}>
          <Text style={s.metaLabel}>Applying for</Text>
          <Text style={s.metaValue}>Software Engineer — Fullstack — Onramper</Text>
        </View>

        <View style={s.divider} />

        {/* Body */}
        <Text style={s.greeting}>Hi Onramper team,</Text>

        <Text style={s.paragraph}>
          I've been in crypto since 2017 — first ICO platforms, then NFT marketplaces, now RWA tokenization. The on-ramp
          problem is one I've run into from the other side many times: users dropping off because buying crypto is still
          too painful. What you're building is the fix for that, and I'd like to help build it.
        </Text>

        <Text style={s.paragraph}>
          My stack is TypeScript and Node.js on the backend, React on the front — which is exactly what the role
          describes. At Evergon I built the backend APIs and services from scratch, set up blockchain indexing, and
          handled all the async edge cases that come with on-chain data. Before that at Levelup.worlds I ran our AWS
          infrastructure (Lambda, S3, media servers) for a live-streaming platform. I'm comfortable owning the backend
          end-to-end, and I know enough React to not be a burden on anyone else when the frontend needs touching.
        </Text>

        <Text style={s.paragraph}>
          The part that probably matters most for Onramper: at Rarible I co-authored an SDK that ended up with 60+
          external integrators across 5 chains. You learn a lot about API design when real developers are building on
          top of your work and you can't just push a breaking change. I suspect Coinbase and Exodus have similar
          opinions about surprises.
        </Text>

        <Text style={s.paragraph}>Happy to talk through any of this — looking forward to it.</Text>

        {/* Closing */}
        <View style={s.closing}>
          <Text>Best,</Text>
          <Text style={s.signature}>Ivan K.</Text>
        </View>
      </Page>
    </Document>
  );
}
