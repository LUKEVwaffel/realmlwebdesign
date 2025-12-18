import PDFDocument from "pdfkit";
import { type QuestionnaireResponse, type Client, type Project } from "@shared/schema";

interface QuestionnaireData {
  questionnaire: QuestionnaireResponse & {
    targetAudience?: string | null;
    primaryGoals?: string | null;
    likedWebsites?: string | null;
    dislikedElements?: string | null;
    preferredFonts?: string | null;
    layoutPreference?: string | null;
    numPages?: string | null;
    mustHaveFeatures?: string | null;
  };
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

export async function generateQuestionnairePdf(data: QuestionnaireData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { questionnaire, client, project } = data;

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
    const lightGray = "#f8f9fa";
    const sectionBg = "#eef2f7";

    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Client Questionnaire Responses", 50, 50);

    doc
      .fillColor(mutedColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${formatDate(new Date())}`, 50, 80);

    doc.rect(50, 100, 512, 60).fill(lightGray);
    
    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Client Information", 60, 110);

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`Business: ${client.businessLegalName}`, 60, 128)
      .text(`Contact: ${data.contactName || "N/A"}`, 60, 142);

    doc
      .text(`Email: ${client.businessEmail || "N/A"}`, 300, 128)
      .text(`Submitted: ${formatDate(questionnaire.submittedAt)}`, 300, 142);

    let yPos = 180;
    const pageHeight = 700;
    const sectionSpacing = 25;
    const lineHeight = 14;

    const addSection = (title: string, content: string | null | undefined) => {
      const text = content || "Not provided";
      const textHeight = doc.heightOfString(text, { width: 472 });
      const sectionHeight = 40 + textHeight;

      if (yPos + sectionHeight > pageHeight) {
        doc.addPage();
        yPos = 50;
      }

      doc.rect(50, yPos, 512, sectionHeight).fill(sectionBg);
      
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(title, 60, yPos + 10);

      doc
        .fillColor(textColor)
        .fontSize(10)
        .font("Helvetica")
        .text(text, 60, yPos + 28, { width: 472 });

      yPos += sectionHeight + sectionSpacing;
    };

    addSection("Business Description", questionnaire.businessDescription);
    addSection("Products & Services", questionnaire.productsServices);
    addSection("Unique Value Proposition", questionnaire.uniqueValue);
    addSection("Target Audience", questionnaire.targetAudienceDescription || questionnaire.targetAudience);
    addSection("Target Age Range", questionnaire.targetAgeRange);
    addSection("Target Location", questionnaire.targetLocation);
    addSection("Primary Goals", questionnaire.primaryGoal || questionnaire.primaryGoals);
    addSection("Success Metrics", questionnaire.successMetrics);
    addSection("Call to Action", questionnaire.callToAction);
    addSection("Competitor Websites", questionnaire.competitorWebsites);
    addSection("Inspiration Websites", questionnaire.inspirationWebsites || questionnaire.likedWebsites);
    addSection("Preferred Colors", questionnaire.preferredColors);
    addSection("Colors to Avoid", questionnaire.avoidColors);
    addSection("Style Preference", questionnaire.stylePreference);
    addSection("Required Pages", questionnaire.requiredPages);
    addSection("Special Features", questionnaire.specialFeatures || questionnaire.mustHaveFeatures);
    addSection("Integrations Needed", questionnaire.integrations);
    addSection("Has Logo", questionnaire.hasLogo ? "Yes" : "No");
    addSection("Has Photos", questionnaire.hasPhotos ? "Yes" : "No");
    addSection("Has Written Content", questionnaire.hasWrittenContent ? "Yes" : "No");
    addSection("Content Notes", questionnaire.contentNotes);
    addSection("Preferred Launch Date", formatDate(questionnaire.preferredLaunchDate));
    addSection("Budget Range", questionnaire.budgetRange);
    addSection("Additional Notes", questionnaire.additionalNotes);

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
        `${COMPANY_INFO.name} | Questionnaire for ${client.businessLegalName}`,
        50,
        footerY + 10,
        { align: "center", width: 495 }
      );

    doc.end();
  });
}
