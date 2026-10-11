/**
 * Draws the PDF certificate with pdf-lib (pure JavaScript — works on Vercel's free plan).
 * Change the wording, colours or layout here.
 */
import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";

const NAVY = rgb(0x0b / 255, 0x25 / 255, 0x45 / 255);
const TEAL = rgb(0x0f / 255, 0x76 / 255, 0x6e / 255);
const GREY = rgb(0x47 / 255, 0x55 / 255, 0x69 / 255);
const LIGHT = rgb(0xee / 255, 0xf3 / 255, 0xf9 / 255);

/** Standard PDF fonts only support Western characters; replace anything else. */
function safe(font: PDFFont, text: string): string {
  return [...text]
    .map((ch) => {
      try {
        font.encodeText(ch);
        return ch;
      } catch {
        return "";
      }
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** Shrink text until it fits the given width. */
function fitSize(font: PDFFont, text: string, maxWidth: number, start: number, min = 14) {
  let size = start;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

export async function renderCertificatePdf(args: { recipientName: string; courseTitle: string; issuedAt: string; code: string }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate of Completion — ${args.courseTitle}`);
  pdf.setAuthor(siteConfig.name);
  pdf.setSubject(`Certificate ${args.code}`);

  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const center = (text: string, y: number, font: PDFFont, size: number, color = NAVY) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  // Background and borders
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: NAVY, borderWidth: 3 });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: TEAL, borderWidth: 0.8 });
  page.drawRectangle({ x: 28, y: height - 110, width: width - 56, height: 82, color: LIGHT });

  // Logo mark (same shapes as the website logo)
  const lx = width / 2 - 20;
  const ly = height - 50;
  page.drawRectangle({ x: lx, y: ly - 40, width: 40, height: 40, color: NAVY });
  page.drawSvgPath("M6 22h6l2.5-6 4 12 3-8h3.5", { x: lx, y: ly, borderColor: rgb(1, 1, 1), borderWidth: 2.4 });
  for (const [cx, cy, r] of [
    [25, 20, 2.2],
    [31, 13, 2],
    [33, 22, 2],
    [29, 29, 1.8],
  ]) {
    page.drawCircle({ x: lx + cx, y: ly - cy, size: r, color: rgb(0x2d / 255, 0xd4 / 255, 0xbf / 255) });
  }
  center(siteConfig.name.toUpperCase(), height - 104, sansBold, 11, TEAL);

  // Main text
  center("Certificate of Completion", height - 175, serifBold, 38);
  center("This is to certify that", height - 220, serif, 16, GREY);

  const name = safe(serifBold, args.recipientName) || "Learner";
  center(name, height - 275, serifBold, fitSize(serifBold, name, width - 160, 40));
  page.drawLine({ start: { x: width / 2 - 200, y: height - 290 }, end: { x: width / 2 + 200, y: height - 290 }, thickness: 0.8, color: TEAL });

  center("has successfully completed the online course", height - 322, serif, 16, GREY);
  const course = safe(serifBold, args.courseTitle);
  center(course, height - 360, serifBold, fitSize(serifBold, course, width - 140, 24));

  // Footer: date, signature, verification
  const footY = 120;
  page.drawText(formatDate(args.issuedAt), { x: 90, y: footY, size: 13, font: sansBold, color: NAVY });
  page.drawLine({ start: { x: 90, y: footY - 8 }, end: { x: 290, y: footY - 8 }, thickness: 0.6, color: GREY });
  page.drawText("Date of completion", { x: 90, y: footY - 24, size: 10, font: sans, color: GREY });

  const instructor = safe(serif, siteConfig.instructor.name);
  page.drawText(instructor, { x: width - 290, y: footY, size: 15, font: serif, color: NAVY });
  page.drawLine({ start: { x: width - 290, y: footY - 8 }, end: { x: width - 90, y: footY - 8 }, thickness: 0.6, color: GREY });
  page.drawText(safe(sans, siteConfig.instructor.title).slice(0, 48), { x: width - 290, y: footY - 24, size: 10, font: sans, color: GREY });

  center(`Certificate ID: ${args.code}`, 62, sansBold, 10, NAVY);
  center(`Verify at ${siteConfig.url.replace(/^https?:\/\//, "")}/verify/${args.code}`, 48, sans, 9, GREY);

  return pdf.save();
}
