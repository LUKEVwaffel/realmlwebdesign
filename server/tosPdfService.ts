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
    const { client } = data;
    const currentDate = formatDate(new Date());
    const clientBusinessName = client.businessLegalName || client.businessDba || "Client";
    const companyName = COMPANY_INFO.name;

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

    const addHeading = (text: string, level: 1 | 2 | 3 = 1) => {
      if (doc.y > 680) doc.addPage();
      const fontSize = level === 1 ? 16 : level === 2 ? 12 : 10;
      doc
        .fillColor(primaryColor)
        .fontSize(fontSize)
        .font("Helvetica-Bold")
        .text(text, 50, doc.y)
        .moveDown(0.5);
    };

    const addParagraph = (text: string) => {
      if (doc.y > 680) doc.addPage();
      doc
        .fillColor(textColor)
        .fontSize(9)
        .font("Helvetica")
        .text(text, 50, doc.y, { width: 512, align: "justify" })
        .moveDown(0.8);
    };

    const addBulletList = (items: string[]) => {
      items.forEach((item) => {
        if (doc.y > 680) doc.addPage();
        doc
          .fillColor(textColor)
          .fontSize(9)
          .font("Helvetica")
          .text(`  •  ${item}`, 50, doc.y, { width: 500 })
          .moveDown(0.3);
      });
      doc.moveDown(0.5);
    };

    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("TERMS OF SERVICE", 50, 50, { align: "center" });

    doc
      .fillColor(mutedColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`Effective Date: ${currentDate}`, 50, 80, { align: "center" })
      .text(`Last Updated: ${currentDate}`, 50, 95, { align: "center" });

    doc.moveDown(2);

    addHeading("1. Introduction and Acceptance of Terms");

    addHeading("1.1 Agreement to Terms", 3);
    addParagraph(`By accessing our services, submitting a project inquiry, signing a proposal, making a payment, or otherwise engaging with our company in any capacity, you ("Client," "you," or "your") acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms," "Agreement," or "TOS"). These Terms constitute a legally binding agreement between you and ${companyName} ("Company," "we," "us," or "our").`);

    addHeading("1.2 Scope of Application", 3);
    addParagraph("These Terms govern all aspects of the business relationship between the Company and the Client, including but not limited to:");
    addBulletList([
      "All design, development, consulting, and related services",
      "Project proposals, contracts, and statements of work",
      "All communications conducted through email, phone, video conference, client portal, or any other medium",
      "All deliverables, including but not limited to websites, graphics, documents, and digital assets",
      "Payment transactions and financial arrangements",
      "Use of any tools, platforms, or portals provided by the Company",
    ]);

    addHeading("1.3 Modifications to Terms", 3);
    addParagraph("The Company reserves the right to modify, update, or replace these Terms at any time at its sole discretion. When material changes are made, we will provide notice through email or posting on our website. Continued use of our services after such modifications constitutes acceptance of the updated Terms.");

    addHeading("2. Client Responsibilities and Obligations");

    addHeading("2.1 Provision of Accurate Information", 3);
    addParagraph("The Client agrees to provide complete, accurate, and truthful information at all stages of the project, including:");
    addBulletList([
      "All questionnaires, intake forms, and discovery documents",
      "Brand guidelines, existing marketing materials, and assets",
      "Target audience information and business objectives",
      "Technical requirements and specifications",
      "Access credentials to necessary platforms and systems",
      "Contact information for all stakeholders and decision-makers",
    ]);

    addHeading("2.2 Timely Responses and Approvals", 3);
    addParagraph("The Client agrees to respond to requests for information, feedback, or approvals within the timeframes specified in project documentation (typically within 3-5 business days). Failure to provide timely responses may result in project delays, and the Company will not be held responsible for missing deadlines due to Client delays.");

    addHeading("2.3 Payment Obligations", 3);
    addParagraph("The Client agrees to pay all fees according to the payment schedule outlined in the project agreement. Late payments may incur interest charges of 1.5% per month (18% annually) or the maximum rate permitted by law, whichever is lower.");

    addHeading("2.4 Content Responsibility", 3);
    addParagraph("The Client is solely responsible for providing all text, images, videos, and other content for the website, ensuring all provided content is original, licensed, or properly attributed, and ensuring content complies with all applicable laws and regulations.");

    addHeading("3. Company Responsibilities");

    addHeading("3.1 Service Delivery Standards", 3);
    addParagraph("The Company commits to deliver design and development services that meet professional industry standards, complete work according to the scope and timeline outlined in the project agreement, and provide work that is free from defects in materials and workmanship.");

    addHeading("3.2 Confidentiality and Data Protection", 3);
    addParagraph("The Company agrees to keep all Client information, data, and project details strictly confidential and not disclose Client information to third parties except as necessary to complete the project or as required by law.");

    addHeading("4. Project Lifecycle and Management");

    addHeading("4.1 Document Gating and Approvals", 3);
    addParagraph("No project phase will commence or progress without obtaining required approvals and signatures from the Client. Approvals must be provided in writing (email or electronic signature). The Client acknowledges that once a phase is approved and signed off, any subsequent changes to that phase may be considered out of scope and subject to additional fees.");

    addHeading("4.2 Revision Policy", 3);
    addParagraph("The project agreement will specify the number of revision rounds included for each deliverable. Revisions beyond the included allowance will be billed at the Company's standard hourly rate or as a fixed additional fee.");

    addHeading("4.3 Project Delays", 3);
    addParagraph("If project delays occur due to Client inaction, unresponsiveness, or failure to provide required materials, the original timeline will be adjusted accordingly. After 30 days of inactivity, the project may be considered dormant. Projects dormant for 90 days may be considered abandoned and subject to cancellation terms.");

    addHeading("5. Payments, Fees, and Refunds");

    addHeading("5.1 Payment Schedule", 3);
    addParagraph("Unless otherwise specified, the standard payment structure is: 50% deposit due upon signing the project agreement, and 50% final payment due upon project completion and before final delivery.");

    addHeading("5.2 Cancellation Before Delivery", 3);
    addParagraph("If the Client chooses to cancel the project before the final website has been delivered, a cancellation fee of $100 will apply. Any work completed up to the point of cancellation must be paid for at the Company's standard hourly rate.");

    addHeading("5.3 No Refunds After Delivery", 3);
    addParagraph("Once the final website has been delivered to the Client, no refunds are available under any circumstances. The Client acknowledges that final delivery constitutes completion of the Company's contractual obligations, and all fees are considered fully earned at that point.");

    addHeading("6. Domain Registration and Hosting");

    addHeading("6.1 Account Creation Requirements", 3);
    addParagraph("Upon request from the Company, the Client must create a domain registrar and hosting account in their own name. This ensures the Client maintains direct ownership and control of their domain.");

    addHeading("6.2 Initial Coverage Period", 3);
    addParagraph("The cost of one full year of domain registration and hosting services is included in the project flat fee. This includes domain registration, hosting service, SSL certificate, and initial DNS configuration.");

    addHeading("6.3 Ongoing Responsibility After Year One", 3);
    addParagraph("After the first year, the Client assumes full and sole responsibility for renewing the domain registration annually and paying all hosting fees. The Company is not responsible for notifying the Client of upcoming renewals.");

    addHeading("7. Intellectual Property Rights");

    addHeading("7.1 Ownership Upon Payment", 3);
    addParagraph("Upon receipt of full payment for the project, the Client receives ownership of the final website code and design elements, custom graphics and visual assets created specifically for the project, and project documentation.");

    addHeading("7.2 Company Portfolio Rights", 3);
    addParagraph("The Company retains the right to display the completed project in its portfolio, on its website, and in marketing materials, and to reference the Client and project in case studies and client lists.");

    addHeading("8. Limitations of Liability");

    addHeading("8.1 No Guarantee of Business Outcomes", 3);
    addParagraph("The Company does not guarantee that the website will generate any specific amount of traffic, leads, or revenue, or that the Client's business will grow or succeed as a result of the website.");

    addHeading("8.2 Limitation of Liability Cap", 3);
    addParagraph("To the maximum extent permitted by law, the Company's total liability for any claims arising from or related to the project shall not exceed the total amount paid by the Client for the project.");

    addHeading("9. Indemnification");
    addParagraph("The Client agrees to indemnify, defend, and hold harmless the Company from any claims, damages, or expenses arising from the Client's content or materials, the Client's use of the website, any breach of these Terms by the Client, or any violation of applicable laws by the Client.");

    addHeading("10. Governing Law and Dispute Resolution");
    addParagraph("These Terms shall be governed by and construed in accordance with applicable laws. Any disputes will be resolved through good faith negotiation, and if unresolved, through binding arbitration.");

    doc.addPage();

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("CLIENT ACKNOWLEDGMENT AND SIGNATURE", 50, 50);

    doc.moveDown(2);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(textColor)
      .text(`By signing below, ${clientBusinessName} acknowledges that they have read, understood, and agree to be bound by these Terms of Service.`, 50, doc.y, { width: 512 })
      .moveDown(2);

    doc
      .text(`Client Business Name: ${clientBusinessName}`, 50, doc.y)
      .moveDown(1)
      .text(`Contact: ${data.contactName || "N/A"}`)
      .moveDown(1)
      .text(`Date: ${currentDate}`)
      .moveDown(3);

    doc
      .text("Client Signature:", 50, doc.y)
      .moveDown(1);

    clientSignatureY = doc.y;

    doc
      .rect(50, doc.y, 250, 60)
      .stroke()
      .moveDown(4);

    doc
      .fontSize(8)
      .fillColor(mutedColor)
      .text(`This document was generated by ${companyName} on ${currentDate}.`, 50, 720, { align: "center" });

    const pageCount = doc.bufferedPageRange().count;
    
    signatureFieldResult = {
      page: pageCount,
      x: 50,
      y: clientSignatureY,
      width: 250,
      height: 60,
    };
    
    doc.end();
  });
}
