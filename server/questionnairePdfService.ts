import PDFDocument from "pdfkit";
import { type Client } from "@shared/schema";

interface QuestionnaireResponses {
  businessDescription?: string;
  targetAudience?: string;
  websiteGoal?: string;
  siteSize?: string;
  designStyle?: string;
  features?: string[];
  likedWebsites?: string;
  preferredColors?: string;
  additionalNotes?: string;
}

interface QuestionnaireData {
  responses: QuestionnaireResponses;
  client: Client;
  contactName?: string;
  submittedAt?: Date | string | null;
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

const websiteGoalLabels: Record<string, string> = {
  leads: "Get people to contact me",
  sales: "Sell products or services",
  info: "Provide information about my business",
  bookings: "Get bookings or appointments",
  credibility: "Build trust and credibility",
};

const siteSizeLabels: Record<string, string> = {
  small: "Small Site (4 pages)",
  medium: "Medium Site (7 pages)",
  large: "Large Site (10+ pages)",
  not_sure: "Not Sure - Let's discuss",
};

const designStyleLabels: Record<string, string> = {
  corporate: "Clean & Professional",
  bold: "Bold & Colorful",
  elegant: "Elegant & Minimal",
  playful: "Friendly & Approachable",
  creative: "Not Sure - Surprise me!",
  modern: "Modern",
  minimal: "Minimal",
  classic: "Classic",
};

const featureLabels: Record<string, string> = {
  contact_form: "Contact Form",
  photo_gallery: "Photo Gallery",
  booking: "Online Booking/Scheduling",
  testimonials: "Customer Testimonials",
  blog: "Blog",
  store: "Online Store",
  social_links: "Social Media Links",
  not_sure: "Not sure what I need",
};

export async function generateQuestionnairePdf(data: QuestionnaireData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { responses, client, contactName, submittedAt } = data;

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

    doc.rect(50, 90, 512, 50).fill(lightGray);
    
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Client:", 60, 100);

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(client.businessLegalName, 100, 100);

    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Contact:", 60, 118);

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(contactName || "N/A", 110, 118);

    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Submitted:", 300, 100);

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica")
      .text(formatDate(submittedAt || null), 360, 100);

    let yPos = 160;
    const pageHeight = 700;
    const sectionSpacing = 20;

    const addSection = (title: string, content: string | null | undefined) => {
      const text = content || "Not provided";
      const textHeight = doc.heightOfString(text, { width: 472 });
      const sectionHeight = 35 + textHeight;

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
        .text(text, 60, yPos + 26, { width: 472 });

      yPos += sectionHeight + sectionSpacing;
    };

    addSection("What does your business do?", responses.businessDescription);
    
    addSection("Who are you trying to reach?", responses.targetAudience);
    
    addSection("Main website goal", 
      responses.websiteGoal ? websiteGoalLabels[responses.websiteGoal] || responses.websiteGoal : null
    );
    
    addSection("Website size", 
      responses.siteSize ? siteSizeLabels[responses.siteSize] || responses.siteSize : null
    );
    
    addSection("Design style", 
      responses.designStyle ? designStyleLabels[responses.designStyle] || responses.designStyle : null
    );
    
    const featuresText = responses.features && responses.features.length > 0
      ? responses.features.map(f => featureLabels[f] || f).join(", ")
      : null;
    addSection("Features needed", featuresText);
    
    addSection("Websites for inspiration", responses.likedWebsites);
    
    addSection("Preferred colors", responses.preferredColors);
    
    addSection("Additional notes", responses.additionalNotes);

    doc.end();
  });
}
