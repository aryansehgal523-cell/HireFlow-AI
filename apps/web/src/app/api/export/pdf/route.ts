import { NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { requireUser } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { ResumePDF } from "@/lib/pdf-template";
import { handleError, parseBody } from "../../helpers";

const schema = z.object({
  resume:    z.record(z.unknown()),
  filename:  z.string().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { resume, filename } = await parseBody(req, schema);

    const watermark = !hasFeature(user.plan, "export_pdf");

    const buffer = await renderToBuffer(
      createElement(ResumePDF, { resume: resume as any, watermark })
    );

    const name = (filename ?? "resume").replace(/[^a-z0-9_-]/gi, "_").slice(0, 80);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}.pdf"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
