/**
 * Download a certificate as PDF: /api/certificates/<verification-code>
 * Anyone with the code can download it (it shows the same information as
 * the public verification page).
 */
import { NextResponse } from "next/server";

import { renderCertificatePdf } from "@/lib/certificate-pdf";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase().trim();
  if (!/^MAI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return new NextResponse("Not found", { status: 404 });
  if (!isAdminClientConfigured) return new NextResponse("Certificates are not configured yet.", { status: 503 });

  const admin = createAdminClient();
  const { data: cert } = await admin
    .from("certificates")
    .select("verification_code, recipient_name, course_title, issued_at")
    .eq("verification_code", code)
    .maybeSingle();
  if (!cert) return new NextResponse("Certificate not found", { status: 404 });

  const bytes = await renderCertificatePdf({
    recipientName: cert.recipient_name,
    courseTitle: cert.course_title,
    issuedAt: cert.issued_at,
    code: cert.verification_code,
  });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${code}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
