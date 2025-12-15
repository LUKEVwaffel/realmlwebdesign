import PDFDocument from "pdfkit";
import { type Payment, type Client, type Project } from "@shared/schema";

interface InvoiceData {
  payment: Payment;
  client: Client;
  project: Project;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

const COMPANY_INFO = {
  name: process.env.COMPANY_NAME || "Web Design Studio",
  address: process.env.COMPANY_ADDRESS || "123 Design Street, Creative City, ST 12345",
  phone: process.env.COMPANY_PHONE || "(555) 123-4567",
  email: process.env.COMPANY_EMAIL || "hello@webdesignstudio.com",
  website: process.env.COMPANY_WEBSITE || "www.webdesignstudio.com",
};

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getProjectTypeName(project: Project): string {
  const typeLabels: Record<string, string> = {
    new_website: "New Website",
    redesign: "Website Redesign",
    landing_page: "Landing Page",
    ecommerce: "E-Commerce Website",
    other: project.projectTypeOther || "Custom Project",
  };
  return typeLabels[project.projectType] || project.projectType;
}

export function generateInvoiceNumber(paymentId: string, createdAt: Date | null): string {
  const date = createdAt || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const shortId = paymentId.slice(-6).toUpperCase();
  return `INV-${year}${month}-${shortId}`;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { payment, client, project } = data;
    const companyInfo = COMPANY_INFO;

    const doc = new PDFDocument({
      size: "LETTER",
      margin: 50,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const primaryColor = "#1a1a2e";
    const secondaryColor = "#16213e";
    const accentColor = "#0f3460";
    const lightGray = "#f8f9fa";
    const textColor = "#333333";
    const mutedColor = "#666666";

    doc
      .fillColor(primaryColor)
      .fontSize(28)
      .font("Helvetica-Bold")
      .text(companyInfo.name, 50, 50);

    doc
      .fillColor(mutedColor)
      .fontSize(10)
      .font("Helvetica")
      .text(companyInfo.address, 50, 85)
      .text(`Phone: ${companyInfo.phone}`, 50, 100)
      .text(`Email: ${companyInfo.email}`, 50, 115)
      .text(companyInfo.website, 50, 130);

    const invoiceNumber = payment.invoiceNumber || generateInvoiceNumber(payment.id, payment.createdAt);
    const isPaid = payment.status === "paid";

    doc
      .fillColor(primaryColor)
      .fontSize(32)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 50, { align: "right" });

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice #: ${invoiceNumber}`, 400, 90, { align: "right" })
      .text(`Date: ${formatDate(payment.createdAt)}`, 400, 105, { align: "right" })
      .text(`Due Date: ${formatDate(payment.dueDate)}`, 400, 120, { align: "right" });

    if (isPaid) {
      doc
        .save()
        .translate(480, 160)
        .rotate(-15)
        .fontSize(24)
        .fillColor("#28a745")
        .font("Helvetica-Bold")
        .text("PAID", -30, 0, { width: 80, align: "center" })
        .restore();
    }

    doc.rect(50, 170, 250, 80).fill(lightGray);
    
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Bill To:", 60, 180);

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(client.businessLegalName, 60, 198)
      .text(client.businessEmail || "", 60, 213);

    if (client.addressStreet) {
      const addressParts = [
        client.addressStreet,
        [client.addressCity, client.addressState, client.addressZip].filter(Boolean).join(", "),
      ].filter(Boolean);
      addressParts.forEach((part, i) => {
        doc.text(part, 60, 228 + i * 12);
      });
    }

    doc.rect(320, 170, 225, 80).fill(lightGray);
    
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Project Details:", 330, 180);

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`Project: ${getProjectTypeName(project)}`, 330, 198)
      .text(`Payment: ${payment.paymentNumber} of ${project.paymentStructure === "50_50" ? "2" : "varies"}`, 330, 213)
      .text(`Status: ${isPaid ? "Paid" : (payment.status || "pending").charAt(0).toUpperCase() + (payment.status || "pending").slice(1)}`, 330, 228);

    const tableTop = 280;
    const tableHeaders = ["Description", "Amount"];
    const colWidths = [380, 115];
    
    doc.rect(50, tableTop, 495, 25).fill(primaryColor);
    
    let xPos = 60;
    tableHeaders.forEach((header, i) => {
      doc
        .fillColor("#ffffff")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(header, xPos, tableTop + 8, {
          width: colWidths[i] - 20,
          align: i === 1 ? "right" : "left",
        });
      xPos += colWidths[i];
    });

    const rowY = tableTop + 25;
    doc.rect(50, rowY, 495, 35).fill("#ffffff").stroke("#e0e0e0");

    const description = payment.description || `Payment ${payment.paymentNumber} for ${getProjectTypeName(project)}`;
    
    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(description, 60, rowY + 12, { width: 360 });

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(formatCurrency(payment.amount), 440, rowY + 12, { width: 95, align: "right" });

    const totalsY = rowY + 55;
    
    doc.rect(320, totalsY, 225, 70).fill(lightGray);

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text("Subtotal:", 330, totalsY + 12)
      .text(formatCurrency(payment.amount), 440, totalsY + 12, { width: 95, align: "right" });

    doc
      .moveTo(330, totalsY + 30)
      .lineTo(535, totalsY + 30)
      .strokeColor("#cccccc")
      .stroke();

    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Total Due:", 330, totalsY + 42)
      .text(formatCurrency(payment.amount), 440, totalsY + 42, { width: 95, align: "right" });

    if (isPaid && payment.paidAt) {
      doc
        .fillColor("#28a745")
        .fontSize(10)
        .font("Helvetica")
        .text(`Paid on: ${formatDate(payment.paidAt)}`, 330, totalsY + 62);
    }

    const notesY = totalsY + 100;
    
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Payment Terms & Notes", 50, notesY);

    doc
      .fillColor(mutedColor)
      .fontSize(9)
      .font("Helvetica")
      .text("Payment is due within 15 days of invoice date unless otherwise specified.", 50, notesY + 18)
      .text("Please include the invoice number with your payment.", 50, notesY + 32)
      .text("Thank you for your business!", 50, notesY + 46);

    const footerY = 720;
    doc
      .moveTo(50, footerY)
      .lineTo(562, footerY)
      .strokeColor("#e0e0e0")
      .stroke();

    doc
      .fillColor(mutedColor)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `${companyInfo.name} | ${companyInfo.email} | ${companyInfo.website}`,
        50,
        footerY + 10,
        { align: "center", width: 495 }
      )
      .text(
        `Invoice generated on ${formatDate(new Date())}`,
        50,
        footerY + 22,
        { align: "center", width: 495 }
      );

    doc.end();
  });
}
