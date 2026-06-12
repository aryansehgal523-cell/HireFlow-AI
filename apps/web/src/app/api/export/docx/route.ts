import { NextResponse } from "next/server";
import { z } from "zod";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { requireUser } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { handleError, parseBody } from "../../helpers";
import type { ResumeContent } from "@hireflow/ats-engine";

const schema = z.object({
  resume:   z.record(z.unknown()),
  filename: z.string().max(100).optional(),
});

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    thematicBreak: true,
    spacing: { before: 240, after: 80 },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    text: text.trim(),
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function buildDocx(r: ResumeContent, watermark: boolean): Document {
  const children: Paragraph[] = [];

  // Header
  children.push(new Paragraph({
    children: [new TextRun({ text: r.basics.name || "Your Name", bold: true, size: 40 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
  }));

  if (r.basics.headline) {
    children.push(new Paragraph({
      children: [new TextRun({ text: r.basics.headline, italics: true, color: "6b7280" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }));
  }

  const contact = [r.basics.email, r.basics.phone, r.basics.location]
    .filter(Boolean).join("  ·  ");
  if (contact) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contact, color: "6b7280", size: 18 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  }

  // Summary
  if (r.summary) {
    children.push(sectionHeading("Summary"));
    children.push(new Paragraph({ text: r.summary, spacing: { after: 120 } }));
  }

  // Experience
  if ((r.experience ?? []).length > 0) {
    children.push(sectionHeading("Experience"));
    for (const exp of r.experience ?? []) {
      const dateRange = [exp.start, exp.end ?? "Present"].filter(Boolean).join(" – ");
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${exp.title}${exp.company ? " · " + exp.company : ""}`, bold: true }),
          new TextRun({ text: `  ${dateRange}`, color: "6b7280" }),
        ],
        spacing: { after: 40 },
      }));
      if (exp.location) {
        children.push(new Paragraph({ children: [new TextRun({ text: exp.location, color: "9ca3af", size: 18 })], spacing: { after: 40 } }));
      }
      for (const b of exp.bullets ?? []) { if (b.trim()) children.push(bullet(b)); }
      children.push(new Paragraph({ spacing: { after: 120 } }));
    }
  }

  // Education
  if ((r.education ?? []).length > 0) {
    children.push(sectionHeading("Education"));
    for (const edu of r.education ?? []) {
      const dateRange = [edu.start, edu.end].filter(Boolean).join(" – ");
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.school, bold: true }),
          new TextRun({ text: `  ${dateRange}`, color: "6b7280" }),
        ],
        spacing: { after: 40 },
      }));
      const degreeText = [edu.degree, edu.field].filter(Boolean).join(", ") + (edu.gpa ? ` · GPA: ${edu.gpa}` : "");
      if (degreeText) children.push(new Paragraph({ children: [new TextRun({ text: degreeText, color: "6b7280" })], spacing: { after: 120 } }));
    }
  }

  // Skills
  if ((r.skills ?? []).length > 0) {
    children.push(sectionHeading("Skills"));
    children.push(new Paragraph({ text: (r.skills ?? []).join("  ·  "), spacing: { after: 120 } }));
  }

  // Projects
  if ((r.projects ?? []).length > 0) {
    children.push(sectionHeading("Projects"));
    for (const proj of r.projects ?? []) {
      const dateRange = [proj.start, proj.end].filter(Boolean).join(" – ");
      children.push(new Paragraph({
        children: [
          new TextRun({ text: proj.name, bold: true }),
          ...(proj.url ? [new TextRun({ text: `  ${proj.url}`, color: "6b7280" })] : []),
          ...(dateRange ? [new TextRun({ text: `  ${dateRange}`, color: "9ca3af" })] : []),
        ],
        spacing: { after: 40 },
      }));
      for (const b of proj.bullets ?? []) { if (b.trim()) children.push(bullet(b)); }
      children.push(new Paragraph({ spacing: { after: 80 } }));
    }
  }

  // Certifications
  if ((r.certifications ?? []).length > 0) {
    children.push(sectionHeading("Certifications"));
    for (const cert of r.certifications ?? []) {
      const text = typeof cert === "string" ? cert : [cert.name, cert.issuer, cert.date].filter(Boolean).join(" · ");
      children.push(new Paragraph({ text, spacing: { after: 60 } }));
    }
  }

  // Languages
  if ((r.languages ?? []).length > 0) {
    children.push(sectionHeading("Languages"));
    const text = (r.languages ?? []).map((l: any) => typeof l === "string" ? l : `${l.language}${l.proficiency ? ` (${l.proficiency})` : ""}`).join("  ·  ");
    children.push(new Paragraph({ text, spacing: { after: 120 } }));
  }

  // Volunteer
  if ((r.volunteer ?? []).length > 0) {
    children.push(sectionHeading("Volunteer"));
    for (const v of r.volunteer ?? []) {
      const dateRange = [v.start, v.end].filter(Boolean).join(" – ");
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${v.role} · ${v.organization}`, bold: true }),
          ...(dateRange ? [new TextRun({ text: `  ${dateRange}`, color: "6b7280" })] : []),
        ],
        spacing: { after: 40 },
      }));
      for (const b of v.bullets ?? []) { if (b.trim()) children.push(bullet(b)); }
      children.push(new Paragraph({ spacing: { after: 80 } }));
    }
  }

  // Awards
  if ((r.awards ?? []).length > 0) {
    children.push(sectionHeading("Awards"));
    for (const a of r.awards ?? []) {
      const text = [a.title, a.issuer, a.date].filter(Boolean).join(" · ") + (a.description ? `  —  ${a.description}` : "");
      children.push(new Paragraph({ text, spacing: { after: 60 } }));
    }
  }

  // Publications
  if ((r.publications ?? []).length > 0) {
    children.push(sectionHeading("Publications"));
    for (const p of r.publications ?? []) {
      const text = [p.title, p.publisher, p.date].filter(Boolean).join(" · ");
      children.push(new Paragraph({ text, spacing: { after: 60 } }));
    }
  }

  if (watermark) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "Created with HireFlow AI · hireflow.ai", color: "d1d5db", size: 14 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }));
  }

  return new Document({ sections: [{ properties: {}, children }] });
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { resume, filename } = await parseBody(req, schema);

    const watermark = !hasFeature(user.plan, "export_docx");
    const doc = buildDocx(resume as ResumeContent, watermark);
    const buffer = await Packer.toBuffer(doc);

    const name = (filename ?? "resume").replace(/[^a-z0-9_-]/gi, "_").slice(0, 80);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${name}.docx"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
