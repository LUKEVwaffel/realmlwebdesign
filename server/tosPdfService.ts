import PDFDocument from "pdfkit";
import { type Client, type Project } from "@shared/schema";

interface TosData {
  client: Client;
  project: Project;
  contactName?: string;
}

interface SignedTosData extends TosData {
  signatureData: string;
  signatureType: "drawn" | "typed";
  signedAt: Date | string;
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
    addParagraph("By creating an account in the Duo client portal, submitting a project questionnaire, approving a quote electronically, providing electronic signatures, or otherwise engaging with the Company's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.");

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

    addHeading("1.4 Electronic Signatures and Agreement", 3);
    addParagraph("By using the Duo client portal to approve quotes, sign documents, or provide project approvals, the Client acknowledges and agrees to the following:");
    addParagraph("Legal Validity of Electronic Signatures:");
    addBulletList([
      "All approvals, signatures, and acceptances submitted through the Duo platform constitute legally binding electronic signatures",
      "Electronic signatures carry the same force and effect as handwritten signatures under the federal Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA)",
      "The Client expressly consents to conducting business electronically through the Duo platform",
    ]);
    addParagraph("Electronic Signature Requirements - By signing electronically through Duo, the Client confirms:");
    addBulletList([
      "Intent to be legally bound by the document being signed",
      "Consent to receive and sign documents electronically",
      "Understanding that electronic signatures are legally equivalent to handwritten signatures",
      "Ability to access, retain, and reproduce electronic records",
    ]);
    addParagraph("Record Retention:");
    addBulletList([
      "All electronic signatures are timestamped and stored securely",
      "The Company maintains records of all signed documents and approvals",
      "Clients may request copies of signed documents at any time",
      "Electronic records will be retained for a minimum of 7 years for legal compliance",
    ]);

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

    addHeading("2.2 Timely Responses and Communication", 3);
    addParagraph("The Client agrees to:");
    addBulletList([
      "Respond to requests for information, feedback, or approvals within 5 business days",
      "Monitor their Duo portal account regularly for project updates and action items",
      "Maintain a current email address for automated notifications",
      "Review and respond to phase approval requests promptly",
    ]);
    addParagraph("Consequences of Delayed Response:");
    addBulletList([
      "Failure to provide timely responses may result in project delays",
      "The Company is not responsible for missing deadlines due to Client delays",
      "Projects inactive for 30 days will be marked \"On Hold\"",
      "Projects inactive for 90 days may be considered abandoned per Section 4.3",
    ]);

    addHeading("2.3 Payment Obligations", 3);
    addParagraph("The Client agrees to pay all fees according to the payment schedule outlined in the project agreement. The standard payment structure is:");
    addBulletList([
      "50% deposit due upon quote approval and signing of this agreement",
      "50% final payment due after hosting setup is complete and before Final Delivery",
    ]);
    addParagraph("Work will not commence until the initial deposit has been received and cleared. Final Delivery will not occur until all payments have been received and cleared. Late payments may incur interest charges of 1.5% per month (18% annually) or the maximum rate permitted by law, whichever is lower.");

    addHeading("2.4 Content Responsibility", 3);
    addParagraph("The Client is solely responsible for:");
    addBulletList([
      "Providing all text, images, videos, and other content for the website",
      "Ensuring all provided content is original, licensed, or properly attributed",
      "Ensuring content complies with all applicable laws and regulations",
    ]);

    addHeading("3. Company Responsibilities");

    addHeading("3.1 Service Delivery Standards", 3);
    addParagraph("The Company commits to:");
    addBulletList([
      "Deliver design and development services that meet professional industry standards",
      "Complete work according to the scope and timeline outlined in the project agreement",
      "Provide work that is free from defects in materials and workmanship",
    ]);

    addHeading("3.2 Confidentiality and Data Protection", 3);
    addParagraph("The Company agrees to:");
    addBulletList([
      "Keep all Client information, data, and project details strictly confidential",
      "Not disclose Client information to third parties except as necessary to complete the project or as required by law",
    ]);

    addHeading("3.3 Limited Warranty", 3);
    addParagraph("The Company provides a 25-day warranty period beginning on the date of Final Delivery (when the website is transferred to the Client's hosting and all credentials are provided).");
    addParagraph("Warranty Coverage Includes:");
    addBulletList([
      "Bug fixes and broken functionality",
      "Defects in workmanship or coding errors",
      "Minor content corrections and updates (typos, text changes)",
      "Small functional adjustments (e.g., adding form fields, button adjustments)",
      "Minor design modifications (e.g., color changes, font adjustments, spacing corrections)",
      "Technical support via email",
      "Reasonable minor additions at Company's discretion (limited to maintain project scope)",
    ]);
    addParagraph("Warranty Does NOT Cover:");
    addBulletList([
      "New pages or sections not included in original scope",
      "Major functional additions (e.g., photo galleries, blogs, e-commerce features, member areas)",
      "Complete design revisions, layout restructuring, or redesigns",
      "Content creation or substantial content additions",
      "Third-party service failures (hosting, plugins, APIs, payment processors)",
      "Issues caused by Client modifications to code, content, or hosting settings",
      "Training sessions or extended consultations beyond initial handoff",
      "SEO services, marketing, analytics setup, or ongoing optimization",
      "Performance issues caused by excessive content or third-party plugins added by Client",
    ]);
    addParagraph("All warranty requests must be submitted via email with a clear description of the issue. The Company will respond within 2-3 business days and resolve covered issues within a reasonable timeframe based on complexity.");

    addHeading("3.4 Browser and Device Compatibility", 3);
    addParagraph("The Company will ensure the website functions properly on current and previous major versions of Chrome, Firefox, Safari, and Edge, with responsive design optimized for modern smartphones and tablets.");

    addHeading("4. Project Lifecycle and Management");

    addHeading("4.1 Project Phases and Approvals", 3);
    addParagraph("The project follows a structured 7-phase development process managed through the Company's Duo client portal:");
    addBulletList([
      "Phase 1 - Account Creation: Client account created and initial setup completed",
      "Phase 2 - Discovery: Client completes project questionnaire",
      "Phase 3 - Quote and Agreement: Quote approval, TOS signing, 50% deposit payment",
      "Phase 4 - Design Consultation: Design requirements finalized and approved",
      "Phase 5 - Development: Website built on staging environment",
      "Phase 6 - Review Preparation: Development complete, ready for preview",
      "Phase 7 - Client Review: Review, revisions, final approval",
      "Phase 7A - Hosting Setup: Client provides Hostinger credentials, Company configures hosting",
      "Phase 7B - Final Payment and Delivery: Final payment, credentials provided, warranty begins",
    ]);
    addParagraph("All phase approvals must be submitted electronically through the Duo platform. Approvals are timestamped and legally binding. Once a phase is approved, any subsequent changes may be considered out of scope.");

    addHeading("4.2 Revision Policy", 3);
    addParagraph("The project agreement will specify the number of revision rounds included for each deliverable. Revisions beyond the included allowance will be billed at the Company's standard hourly rate or as a fixed additional fee.");

    addHeading("4.3 Project Delays", 3);
    addParagraph("If project delays occur due to Client inaction, unresponsiveness, or failure to provide required materials, the original timeline will be adjusted accordingly.");
    addParagraph("Abandoned Project Terms - If a project is abandoned due to Client inactivity:");
    addBulletList([
      "The 50% deposit is non-refundable and fully earned by the Company",
      "Any work completed remains the property of the Company",
      "The Client forfeits all rights to the work product",
      "The project will be officially closed",
    ]);

    addHeading("5. Payments, Fees, and Refunds");

    addHeading("5.1 Payment Structure", 3);
    addParagraph("The standard payment structure is:");
    addBulletList([
      "50% deposit: Due upon quote approval and signing of this agreement, before development begins",
      "50% final payment: Due after hosting setup is complete (Phase 7A) and before Final Delivery (Phase 7B)",
    ]);
    addParagraph("\"Final Delivery\" is defined as the transfer of the completed website to the Client's Hostinger hosting account and provision of all access credentials, passwords, and documentation. The 25-day warranty period begins on the date of Final Delivery.");

    addHeading("5.2 Cancellation and Refund Policy", 3);
    addParagraph("Before work begins: If the Client cancels after paying the 50% deposit but before any development work has commenced, the Client will receive a refund of the deposit minus a $75 processing fee.");
    addParagraph("After work begins: If the Client cancels after development has begun, a $150 cancellation fee applies. The 50% deposit is non-refundable once work begins.");
    addParagraph("After Final Delivery: No refunds once the website has been transferred to the Client's hosting account and credentials have been provided.");

    addHeading("6. Domain Registration and Hosting");

    addHeading("6.1 Client-Owned Hosting Accounts", 3);
    addParagraph("To ensure long-term ownership and control, the Client is required to create a Hostinger hosting account and domain registrar account in their own name, using their own email address and payment method.");
    addBulletList([
      "Ensures the Client maintains 100% ownership and control of their website and domain",
      "Protects the Client's investment regardless of the Company's business status",
      "Prevents vendor lock-in or dependency on the Company",
      "Represents industry best practice for client asset protection",
    ]);

    addHeading("6.2 Initial Coverage Period", 3);
    addParagraph("The cost of one full year of domain registration and Hostinger hosting services is included in the project flat fee. This includes domain registration, hosting service, SSL certificate, initial DNS configuration, website transfer, and basic SEO setup.");

    addHeading("6.3 Ongoing Responsibility After Year One", 3);
    addParagraph("After the first year, the Client acknowledges and accepts full responsibility for:");
    addBulletList([
      "Domain registration renewal (annually)",
      "Hostinger hosting service payments and renewals",
      "Website security monitoring and updates",
      "Backup management and disaster recovery",
      "Content updates and modifications",
    ]);

    addHeading("7. Intellectual Property Rights");

    addHeading("7.1 Ownership Upon Payment", 3);
    addParagraph("Upon receipt of full payment for the project, the Client receives ownership of:");
    addBulletList([
      "The final website code and design elements",
      "Custom graphics and visual assets created specifically for the project",
      "Project documentation",
    ]);

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
    addParagraph("These Terms shall be governed by and construed in accordance with applicable laws. Any disputes will be resolved through good faith negotiation, and if unresolved, through binding arbitration in accordance with the rules of the American Arbitration Association.");

    addHeading("11. Data Security and Privacy");

    addHeading("11.1 Client Portal Access", 3);
    addParagraph("The Client is responsible for maintaining the confidentiality of their Duo account credentials, all activity that occurs under their account, and notifying the Company immediately of any unauthorized access. The Company is not liable for losses or damages resulting from the Client's failure to secure their account credentials.");

    addHeading("11.2 Data Storage and Security", 3);
    addParagraph("The Company implements reasonable security measures to protect Client data stored in the Duo platform, including secure encrypted connections (SSL/TLS), password-protected accounts, regular security updates and monitoring, and secure backup systems.");

    addHeading("11.3 Data Retention", 3);
    addParagraph("The Company retains Client data including:");
    addBulletList([
      "Project documents and approvals: Minimum 7 years",
      "Payment records: Minimum 7 years",
      "Electronic signatures and timestamps: Minimum 7 years",
      "Communication history: Duration of project plus 2 years",
    ]);
    addParagraph("Clients may request copies of their data at any time during and after the project.");

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

export async function generateSignedTosPdf(data: SignedTosData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { client, signatureData, signatureType, signedAt } = data;
    const currentDate = formatDate(new Date());
    const signedDate = formatDate(signedAt);
    const clientBusinessName = client.businessLegalName || client.businessDba || "Client";
    const companyName = COMPANY_INFO.name;

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

    // Add SIGNED watermark at top
    doc
      .fillColor("#22c55e")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("SIGNED DOCUMENT", 50, 30, { align: "right" });

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
      .text(`Signed Date: ${signedDate}`, 50, 95, { align: "center" });

    doc.moveDown(2);

    addHeading("1. Introduction and Acceptance of Terms");

    addHeading("1.1 Agreement to Terms", 3);
    addParagraph(`By accessing our services, submitting a project inquiry, signing a proposal, making a payment, or otherwise engaging with our company in any capacity, you ("Client," "you," or "your") acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms," "Agreement," or "TOS"). These Terms constitute a legally binding agreement between you and ${companyName} ("Company," "we," "us," or "our").`);
    addParagraph("By creating an account in the Duo client portal, submitting a project questionnaire, approving a quote electronically, providing electronic signatures, or otherwise engaging with the Company's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.");

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

    addHeading("1.4 Electronic Signatures and Agreement", 3);
    addParagraph("By using the Duo client portal to approve quotes, sign documents, or provide project approvals, the Client acknowledges and agrees to the following:");
    addParagraph("Legal Validity of Electronic Signatures:");
    addBulletList([
      "All approvals, signatures, and acceptances submitted through the Duo platform constitute legally binding electronic signatures",
      "Electronic signatures carry the same force and effect as handwritten signatures under the federal Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA)",
      "The Client expressly consents to conducting business electronically through the Duo platform",
    ]);
    addParagraph("Electronic Signature Requirements - By signing electronically through Duo, the Client confirms:");
    addBulletList([
      "Intent to be legally bound by the document being signed",
      "Consent to receive and sign documents electronically",
      "Understanding that electronic signatures are legally equivalent to handwritten signatures",
      "Ability to access, retain, and reproduce electronic records",
    ]);

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

    addHeading("2.2 Timely Responses and Communication", 3);
    addParagraph("The Client agrees to:");
    addBulletList([
      "Respond to requests for information, feedback, or approvals within 5 business days",
      "Monitor their Duo portal account regularly for project updates and action items",
      "Maintain a current email address for automated notifications",
      "Review and respond to phase approval requests promptly",
    ]);

    addHeading("2.3 Payment Obligations", 3);
    addParagraph("The Client agrees to pay all fees according to the payment schedule outlined in the project agreement. The standard payment structure is:");
    addBulletList([
      "50% deposit due upon quote approval and signing of this agreement",
      "50% final payment due after hosting setup is complete and before Final Delivery",
    ]);
    addParagraph("Work will not commence until the initial deposit has been received and cleared. Final Delivery will not occur until all payments have been received and cleared. Late payments may incur interest charges of 1.5% per month (18% annually) or the maximum rate permitted by law, whichever is lower.");

    addHeading("2.4 Content Responsibility", 3);
    addParagraph("The Client is solely responsible for:");
    addBulletList([
      "Providing all text, images, videos, and other content for the website",
      "Ensuring all provided content is original, licensed, or properly attributed",
      "Ensuring content complies with all applicable laws and regulations",
    ]);

    addHeading("3. Company Responsibilities");

    addHeading("3.1 Service Delivery Standards", 3);
    addParagraph("The Company commits to:");
    addBulletList([
      "Deliver design and development services that meet professional industry standards",
      "Complete work according to the scope and timeline outlined in the project agreement",
      "Provide work that is free from defects in materials and workmanship",
    ]);

    addHeading("3.2 Confidentiality and Data Protection", 3);
    addParagraph("The Company agrees to:");
    addBulletList([
      "Keep all Client information, data, and project details strictly confidential",
      "Not disclose Client information to third parties except as necessary to complete the project or as required by law",
    ]);

    addHeading("3.3 Limited Warranty", 3);
    addParagraph("The Company provides a 25-day warranty period beginning on the date of Final Delivery (when the website is transferred to the Client's hosting and all credentials are provided).");
    addParagraph("Warranty Coverage Includes:");
    addBulletList([
      "Bug fixes and broken functionality",
      "Defects in workmanship or coding errors",
      "Minor content corrections and updates (typos, text changes)",
      "Small functional adjustments (e.g., adding form fields, button adjustments)",
      "Minor design modifications (e.g., color changes, font adjustments, spacing corrections)",
      "Technical support via email",
    ]);
    addParagraph("Warranty Does NOT Cover:");
    addBulletList([
      "New pages or sections not included in original scope",
      "Major functional additions (e.g., photo galleries, blogs, e-commerce features)",
      "Complete design revisions or redesigns",
      "Content creation or substantial content additions",
      "Third-party service failures (hosting, plugins, APIs)",
      "Issues caused by Client modifications to code or hosting settings",
    ]);

    addHeading("4. Project Lifecycle and Management");

    addHeading("4.1 Project Phases and Approvals", 3);
    addParagraph("The project follows a structured 7-phase development process managed through the Company's Duo client portal:");
    addBulletList([
      "Phase 1 - Account Creation: Client account created and initial setup completed",
      "Phase 2 - Discovery: Client completes project questionnaire",
      "Phase 3 - Quote and Agreement: Quote approval, TOS signing, 50% deposit payment",
      "Phase 4 - Design Consultation: Design requirements finalized and approved",
      "Phase 5 - Development: Website built on staging environment",
      "Phase 6 - Review Preparation: Development complete, ready for preview",
      "Phase 7 - Client Review: Review, revisions, final approval",
      "Phase 7A - Hosting Setup: Client provides Hostinger credentials, Company configures hosting",
      "Phase 7B - Final Payment and Delivery: Final payment, credentials provided, warranty begins",
    ]);
    addParagraph("All phase approvals must be submitted electronically through the Duo platform. Approvals are timestamped and legally binding.");

    addHeading("4.2 Revision Policy", 3);
    addParagraph("The project agreement will specify the number of revision rounds included for each deliverable. Revisions beyond the included allowance will be billed at the Company's standard hourly rate or as a fixed additional fee.");

    addHeading("4.3 Project Delays", 3);
    addParagraph("If project delays occur due to Client inaction, unresponsiveness, or failure to provide required materials, the original timeline will be adjusted accordingly.");

    addHeading("5. Payments, Fees, and Refunds");

    addHeading("5.1 Payment Structure", 3);
    addParagraph("The standard payment structure is:");
    addBulletList([
      "50% deposit: Due upon quote approval and signing of this agreement, before development begins",
      "50% final payment: Due after hosting setup is complete (Phase 7A) and before Final Delivery (Phase 7B)",
    ]);
    addParagraph("\"Final Delivery\" is defined as the transfer of the completed website to the Client's Hostinger hosting account and provision of all access credentials, passwords, and documentation. The 25-day warranty period begins on the date of Final Delivery.");

    addHeading("5.2 Cancellation and Refund Policy", 3);
    addParagraph("Before work begins: If the Client cancels after paying the 50% deposit but before any development work has commenced, the Client will receive a refund of the deposit minus a $75 processing fee.");
    addParagraph("After work begins: If the Client cancels after development has begun, a $150 cancellation fee applies. The 50% deposit is non-refundable once work begins.");
    addParagraph("After Final Delivery: No refunds once the website has been transferred to the Client's hosting account and credentials have been provided.");

    addHeading("6. Domain Registration and Hosting");

    addHeading("6.1 Client-Owned Hosting Accounts", 3);
    addParagraph("To ensure long-term ownership and control, the Client is required to create a Hostinger hosting account and domain registrar account in their own name.");

    addHeading("6.2 Initial Coverage Period", 3);
    addParagraph("The cost of one full year of domain registration and Hostinger hosting services is included in the project flat fee. This includes domain registration, hosting service, SSL certificate, initial DNS configuration, and basic SEO setup.");

    addHeading("6.3 Ongoing Responsibility After Year One", 3);
    addParagraph("After the first year, the Client acknowledges and accepts full responsibility for domain registration renewal, hosting service payments and renewals, and website security monitoring and updates.");

    addHeading("7. Intellectual Property Rights");

    addHeading("7.1 Ownership Upon Payment", 3);
    addParagraph("Upon receipt of full payment for the project, the Client receives ownership of:");
    addBulletList([
      "The final website code and design elements",
      "Custom graphics and visual assets created specifically for the project",
      "Project documentation",
    ]);

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
    addParagraph("These Terms shall be governed by and construed in accordance with applicable laws. Any disputes will be resolved through good faith negotiation, and if unresolved, through binding arbitration in accordance with the rules of the American Arbitration Association.");

    addHeading("11. Data Security and Privacy");

    addHeading("11.1 Client Portal Access", 3);
    addParagraph("The Client is responsible for maintaining the confidentiality of their Duo account credentials, all activity that occurs under their account, and notifying the Company immediately of any unauthorized access.");

    addHeading("11.2 Data Storage and Security", 3);
    addParagraph("The Company implements reasonable security measures to protect Client data stored in the Duo platform, including secure encrypted connections (SSL/TLS), password-protected accounts, and secure backup systems.");

    addHeading("11.3 Data Retention", 3);
    addParagraph("The Company retains Client data including:");
    addBulletList([
      "Project documents and approvals: Minimum 7 years",
      "Payment records: Minimum 7 years",
      "Electronic signatures and timestamps: Minimum 7 years",
      "Communication history: Duration of project plus 2 years",
    ]);
    addParagraph("Clients may request copies of their data at any time during and after the project.");

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
      .text(`Date Signed: ${signedDate}`)
      .moveDown(3);

    doc
      .text("Client Signature:", 50, doc.y)
      .moveDown(1);

    const signatureY = doc.y;

    // Draw signature box with green border to indicate signed
    doc
      .rect(50, signatureY, 250, 60)
      .lineWidth(2)
      .strokeColor("#22c55e")
      .stroke();

    // Add signature inside the box
    if (signatureType === "typed") {
      doc
        .fontSize(18)
        .font("Helvetica-Oblique")
        .fillColor(textColor)
        .text(signatureData, 60, signatureY + 20, { width: 230 });
    } else if (signatureType === "drawn" && signatureData.startsWith("data:image")) {
      try {
        const base64Data = signatureData.split(",")[1];
        const imgBuffer = Buffer.from(base64Data, "base64");
        doc.image(imgBuffer, 55, signatureY + 5, { width: 240, height: 50 });
      } catch (err) {
        doc
          .fontSize(12)
          .font("Helvetica-Oblique")
          .fillColor(textColor)
          .text("[Signature on file]", 60, signatureY + 20);
      }
    }

    doc.moveDown(5);

    // Add verification footer
    doc
      .fontSize(8)
      .fillColor("#22c55e")
      .font("Helvetica-Bold")
      .text(`This document was electronically signed on ${signedDate}`, 50, doc.y, { align: "center" });

    doc
      .fontSize(8)
      .fillColor(mutedColor)
      .font("Helvetica")
      .text(`Generated by ${companyName}`, 50, 720, { align: "center" });
    
    doc.end();
  });
}
