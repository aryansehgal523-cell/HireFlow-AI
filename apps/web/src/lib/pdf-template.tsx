import {
  Document, Page, Text, View, StyleSheet, Link, Font,
} from "@react-pdf/renderer";
import type { ResumeContent } from "@hireflow/ats-engine";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

const c = {
  ink: "#1a1a2e",
  signal: "#16a34a",
  muted: "#6b7280",
  line: "#e5e7eb",
};

const s = StyleSheet.create({
  page:        { fontFamily: "Inter", fontSize: 9, color: c.ink, paddingTop: 36, paddingBottom: 36, paddingHorizontal: 48 },
  name:        { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  headline:    { fontSize: 10, color: c.muted, marginBottom: 4 },
  contact:     { flexDirection: "row", flexWrap: "wrap", gap: 6, fontSize: 8, color: c.muted, marginBottom: 16 },
  contactItem: { flexDirection: "row", gap: 2 },
  section:     { marginBottom: 12 },
  sectionTitle:{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: c.signal, borderBottomWidth: 0.5, borderBottomColor: c.signal, paddingBottom: 2, marginBottom: 6 },
  row:         { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  bold:        { fontWeight: 700 },
  muted:       { color: c.muted },
  bullet:      { flexDirection: "row", gap: 4, marginBottom: 2, paddingLeft: 4 },
  bulletDot:   { color: c.signal, width: 6 },
  bulletText:  { flex: 1 },
  summary:     { color: c.ink, lineHeight: 1.5, marginBottom: 12 },
  skillsWrap:  { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skill:       { backgroundColor: "#f0fdf4", color: c.signal, fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  watermark:   { position: "absolute", bottom: 20, right: 48, fontSize: 7, color: "#d1d5db" },
});

function Bullet({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function ResumePDF({ resume, watermark }: { resume: ResumeContent; watermark: boolean }) {
  const { basics, summary, experience, education, skills, projects, certifications, languages, volunteer, awards, publications } = resume;

  const contactParts = [
    basics.email,
    basics.phone,
    basics.location,
    ...(basics.links ?? []).map((l: any) => l.url ?? l),
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <Text style={s.name}>{basics.name || "Your Name"}</Text>
        {basics.headline && <Text style={s.headline}>{basics.headline}</Text>}
        <View style={s.contact}>
          {contactParts.map((p, i) => (
            <Text key={i} style={s.muted}>{i > 0 ? "· " : ""}{p}</Text>
          ))}
        </View>

        {/* Summary */}
        {summary && (
          <Section title="Summary">
            <Text style={s.summary}>{summary}</Text>
          </Section>
        )}

        {/* Experience */}
        {(experience ?? []).length > 0 && (
          <Section title="Experience">
            {(experience ?? []).map((exp, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={s.row}>
                  <Text style={s.bold}>{exp.title}{exp.company ? ` · ${exp.company}` : ""}</Text>
                  <Text style={s.muted}>{[exp.start, exp.end ?? "Present"].filter(Boolean).join(" – ")}</Text>
                </View>
                {exp.location && <Text style={[s.muted, { marginBottom: 3, fontSize: 8 }]}>{exp.location}</Text>}
                {(exp.bullets ?? []).map((b, j) => <Bullet key={j} text={b} />)}
              </View>
            ))}
          </Section>
        )}

        {/* Education */}
        {(education ?? []).length > 0 && (
          <Section title="Education">
            {(education ?? []).map((edu, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={s.row}>
                  <Text style={s.bold}>{edu.school}</Text>
                  <Text style={s.muted}>{[edu.start, edu.end].filter(Boolean).join(" – ")}</Text>
                </View>
                <Text style={s.muted}>{[edu.degree, edu.field].filter(Boolean).join(", ")}{edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Skills */}
        {(skills ?? []).length > 0 && (
          <Section title="Skills">
            <View style={s.skillsWrap}>
              {(skills ?? []).map((sk, i) => <Text key={i} style={s.skill}>{sk}</Text>)}
            </View>
          </Section>
        )}

        {/* Projects */}
        {(projects ?? []).length > 0 && (
          <Section title="Projects">
            {(projects ?? []).map((proj, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={s.row}>
                  <Text style={s.bold}>{proj.name}{proj.url ? ` · ${proj.url}` : ""}</Text>
                  <Text style={s.muted}>{[proj.start, proj.end].filter(Boolean).join(" – ")}</Text>
                </View>
                {(proj.bullets ?? []).map((b, j) => <Bullet key={j} text={b} />)}
              </View>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {(certifications ?? []).length > 0 && (
          <Section title="Certifications">
            {(certifications ?? []).map((cert: any, i: number) => (
              <Text key={i} style={{ marginBottom: 2 }}>
                {typeof cert === "string" ? cert : [cert.name, cert.issuer, cert.date].filter(Boolean).join(" · ")}
              </Text>
            ))}
          </Section>
        )}

        {/* Languages */}
        {(languages ?? []).length > 0 && (
          <Section title="Languages">
            <Text>{(languages ?? []).map((l: any) => typeof l === "string" ? l : `${l.language}${l.proficiency ? ` (${l.proficiency})` : ""}`).join("  ·  ")}</Text>
          </Section>
        )}

        {/* Volunteer */}
        {(volunteer ?? []).length > 0 && (
          <Section title="Volunteer">
            {(volunteer ?? []).map((v, i) => (
              <View key={i} style={{ marginBottom: 5 }}>
                <View style={s.row}>
                  <Text style={s.bold}>{v.role} · {v.organization}</Text>
                  <Text style={s.muted}>{[v.start, v.end].filter(Boolean).join(" – ")}</Text>
                </View>
                {(v.bullets ?? []).map((b, j) => <Bullet key={j} text={b} />)}
              </View>
            ))}
          </Section>
        )}

        {/* Awards */}
        {(awards ?? []).length > 0 && (
          <Section title="Awards">
            {(awards ?? []).map((a, i) => (
              <Text key={i} style={{ marginBottom: 2 }}>
                {[a.title, a.issuer, a.date].filter(Boolean).join(" · ")}
                {a.description ? `  —  ${a.description}` : ""}
              </Text>
            ))}
          </Section>
        )}

        {/* Publications */}
        {(publications ?? []).length > 0 && (
          <Section title="Publications">
            {(publications ?? []).map((p, i) => (
              <Text key={i} style={{ marginBottom: 2 }}>
                {[p.title, p.publisher, p.date].filter(Boolean).join(" · ")}
              </Text>
            ))}
          </Section>
        )}

        {watermark && (
          <Text style={s.watermark}>Created with HireFlow AI · hireflow.ai</Text>
        )}
      </Page>
    </Document>
  );
}
