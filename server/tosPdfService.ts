import PDFDocument from "pdfkit";
import { type Client, type Project } from "@shared/schema";

interface TosData {
  client: Client;
  project: Project;
  contactName?: string;
}

const COMPANY_INFO = {
  name: process.env.COMPANY_NAME || "Web Design Studio",
  address: process.env.COMPANY_ADDRESS || "123 Design Street, Creative City, ST 12345",
  phone: process.env.COMPANY_PHONE || "(555) 123-4567",
  email: process.env.COMPANY_EMAIL || "hello@webdesignstudio.com",
  website: process.env.COMPANY_WEBSITE || "www.webdesignstudio.com",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface TosGenerationResult {
  buffer: Buffer;
  signatureField: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export async function generateTosPdf(data: TosData): Promise<TosGenerationResult> {
  return new Promise((resolve, reject) => {
    let clientSignatureY = 0;
    const { client, project } = data;
    const currentDate = formatDate(new Date());
    const clientBusinessName = client.businessLegalName || client.businessDba || "Client";

    const doc = new PDFDocument({
      size: "LETTER",
      margin: 50,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    let signatureFieldResult: TosGenerationResult["signatureField"] = {
      page: 2,
      x: 50,
      y: 270,
      width: 200,
      height: 40,
    };
    
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve({ buffer: Buffer.concat(chunks), signatureField: signatureFieldResult }));
    doc.on("error", reject);

    const primaryColor = "#1a1a2e";
    const textColor = "#333333";
    const mutedColor = "#666666";

    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("TERMS OF SERVICE AGREEMENT", 50, 50, { align: "center" });

    doc
      .fillColor(mutedColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`Date: ${currentDate}`, 50, 80, { align: "center" });

    doc.moveDown(2);

    doc
      .fillColor(textColor)
      .fontSize(11)
      .font("Helvetica")
      .text(`This Terms of Service Agreement ("Agreement") is entered into as of ${currentDate} by and between:`, 50, doc.y)
      .moveDown();

    doc
      .font("Helvetica-Bold")
      .text(`Service Provider: ${COMPANY_INFO.name}`)
      .font("Helvetica")
      .text(COMPANY_INFO.address)
      .text(`Email: ${COMPANY_INFO.email}`)
      .moveDown();

    doc
      .font("Helvetica-Bold")
      .text(`Client: ${clientBusinessName}`)
      .font("Helvetica")
      .text(`Contact: ${data.contactName || "N/A"}`)
      .moveDown(2);

    const sections = [
      {
        title: "1. SCOPE OF SERVICES",
        content: `${COMPANY_INFO.name} agrees to provide web design and development services for ${clientBusinessName} as outlined in the project specifications. This includes the design, development, and deployment of a custom website according to the agreed-upon requirements.`
      },
      {
        title: "2. PROJECT TIMELINE",
        content: "The project will be completed according to the timeline established in the project proposal. Any delays caused by client response times or additional revision requests may extend the timeline accordingly."
      },
      {
        title: "3. PAYMENT TERMS",
        content: `Payment shall be made according to the agreed payment structure. A deposit is required before work begins. The remaining balance is due upon project completion or as specified in the payment schedule.`
      },
      {
        title: "4. CLIENT RESPONSIBILITIES",
        content: `${clientBusinessName} agrees to:\n- Provide all necessary content, images, and materials in a timely manner\n- Review and approve designs within the agreed timeframes\n- Communicate any concerns or change requests promptly\n- Make payments according to the agreed schedule`
      },
      {
        title: "5. REVISIONS AND CHANGES",
        content: "The project includes a reasonable number of revision rounds as specified in the proposal. Additional revisions or significant scope changes may incur additional fees."
      },
      {
        title: "6. INTELLECTUAL PROPERTY",
        content: `Upon full payment, ${clientBusinessName} will own the rights to the final website design. ${COMPANY_INFO.name} retains the right to display the work in portfolio materials.`
      },
      {
        title: "7. CONFIDENTIALITY",
        content: "Both parties agree to maintain confidentiality regarding proprietary information shared during the project."
      },
      {
        title: "8. TERMINATION",
        content: "Either party may terminate this agreement with written notice. In case of termination, Client agrees to pay for all work completed up to that point."
      },
      {
        title: "9. LIMITATION OF LIABILITY",
        content: `${COMPANY_INFO.name}'s liability is limited to the total amount paid for services. Neither party shall be liable for indirect, incidental, or consequential damages.`
      },
      {
        title: "10. ACCEPTANCE",
        content: `By signing below, ${clientBusinessName} agrees to the terms and conditions outlined in this Agreement.`
      }
    ];

    for (const section of sections) {
      if (doc.y > 680) {
        doc.addPage();
      }
      
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(primaryColor)
        .text(section.title, 50, doc.y)
        .moveDown(0.5);
      
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(textColor)
        .text(section.content, 50, doc.y, { width: 512, align: "justify" })
        .moveDown(1.5);
    }

    doc.addPage();

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("SIGNATURES", 50, 50);

    doc.moveDown(2);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(textColor)
      .text(`Service Provider: ${COMPANY_INFO.name}`, 50, doc.y)
      .moveDown(2);

    doc
      .moveTo(50, doc.y)
      .lineTo(250, doc.y)
      .stroke()
      .moveDown(0.5);

    doc
      .text("Authorized Signature", 50, doc.y)
      .moveDown(0.5)
      .text(`Date: ${currentDate}`)
      .moveDown(3);

    doc
      .text(`Client: ${clientBusinessName}`, 50, doc.y)
      .moveDown(2);

    clientSignatureY = doc.y;
    
    doc
      .moveTo(50, doc.y)
      .lineTo(250, doc.y)
      .stroke()
      .moveDown(0.5);

    doc
      .text("Client Signature", 50, doc.y)
      .moveDown(0.5)
      .text("Date: _____________________");

    doc
      .fontSize(8)
      .fillColor(mutedColor)
      .text(`Generated by ${COMPANY_INFO.name}`, 50, 720, { align: "center" });

    const pageCount = doc.bufferedPageRange().count;
    
    signatureFieldResult = {
      page: pageCount,
      x: 50,
      y: clientSignatureY,
      width: 200,
      height: 40,
    };
    
    doc.end();
  });
}
