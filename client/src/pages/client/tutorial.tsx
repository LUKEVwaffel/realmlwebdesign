import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2,
  Home,
  FileText,
  CreditCard,
  MessageSquare,
  FolderOpen,
  ClipboardList,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Play,
  X
} from "lucide-react";
import { PortalLayout } from "@/components/portal/portal-layout";
import { Link } from "wouter";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: typeof Home;
  tips: string[];
  action?: { label: string; href: string };
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Dashboard Overview",
    description: "Your dashboard is the home base for your project. Here you can see your project status, recent activity, and quick links to important sections.",
    icon: Home,
    tips: [
      "Check your dashboard regularly to stay updated on project progress",
      "Your current project phase is shown at the top",
      "Quick actions help you navigate to what needs your attention"
    ],
    action: { label: "Go to Dashboard", href: "/client/dashboard" }
  },
  {
    id: 2,
    title: "Complete Your Questionnaire",
    description: "The questionnaire helps us understand your business and design preferences. This is one of the first steps in your project journey.",
    icon: ClipboardList,
    tips: [
      "Take your time filling out the questionnaire thoroughly",
      "Include details about your brand colors, competitors, and inspiration",
      "You can save and return to the questionnaire later"
    ],
    action: { label: "Fill Questionnaire", href: "/client/questionnaire" }
  },
  {
    id: 3,
    title: "Review Quotes",
    description: "View and respond to project quotes from your design team. You can approve or request changes to the proposed scope and pricing.",
    icon: FileCheck,
    tips: [
      "Review all line items carefully before approving",
      "If you have questions, use the messaging feature",
      "Approved quotes will move your project forward"
    ],
    action: { label: "View Quotes", href: "/client/quotes" }
  },
  {
    id: 4,
    title: "Manage Payments",
    description: "View your invoices, payment history, and make payments securely through our portal. Track what's been paid and what's upcoming.",
    icon: CreditCard,
    tips: [
      "Payments are processed securely through Stripe",
      "You'll receive email confirmations for each payment",
      "Contact us if you need to discuss payment arrangements"
    ],
    action: { label: "View Payments", href: "/client/payments" }
  },
  {
    id: 5,
    title: "Access Documents",
    description: "Important project documents like contracts, terms of service, and design mockups are stored here. Review and sign documents when needed.",
    icon: FolderOpen,
    tips: [
      "Some documents require your signature - look for the signature badge",
      "Download copies of important documents for your records",
      "New documents will appear here as your project progresses"
    ],
    action: { label: "View Documents", href: "/client/documents" }
  },
  {
    id: 6,
    title: "Send Messages",
    description: "Communicate directly with your design team. Ask questions, provide feedback, or share updates about your project.",
    icon: MessageSquare,
    tips: [
      "Be specific when asking questions or providing feedback",
      "We'll respond as quickly as possible during business hours",
      "Include screenshots or examples when helpful"
    ],
    action: { label: "Send Message", href: "/client/messages" }
  }
];

export default function ClientTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (!completedSteps.includes(tutorialSteps[currentStep].id)) {
      setCompletedSteps([...completedSteps, tutorialSteps[currentStep].id]);
    }
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  const step = tutorialSteps[currentStep];
  const IconComponent = step.icon;
  const progress = ((completedSteps.length) / tutorialSteps.length) * 100;

  return (
    <PortalLayout requiredRole="client">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              Welcome to Your Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              Learn how to navigate your client portal
            </p>
          </div>
          <Link href="/client/dashboard">
            <Button variant="outline" className="gap-2" data-testid="button-skip-tutorial">
              <X className="w-4 h-4" />
              Skip Tutorial
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-sm font-medium">Your Progress</CardTitle>
              <span className="text-sm text-muted-foreground">
                {completedSteps.length} of {tutorialSteps.length} completed
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {tutorialSteps.map((s, index) => {
                const StepIcon = s.icon;
                const isCompleted = completedSteps.includes(s.id);
                const isCurrent = index === currentStep;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleStepClick(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover-elevate"
                    }`}
                    data-testid={`button-step-${s.id}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-primary/5 p-8 flex items-center justify-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <IconComponent className="w-16 h-16 text-primary" />
            </div>
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Step {step.id} of {tutorialSteps.length}</Badge>
            </div>
            <CardTitle className="font-serif text-2xl mt-2">{step.title}</CardTitle>
            <CardDescription className="text-base">{step.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Tips</h4>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {step.action && (
              <Link href={step.action.href}>
                <Button className="gap-2" data-testid={`button-action-${step.id}`}>
                  <Play className="w-4 h-4" />
                  {step.action.label}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
            data-testid="button-previous"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep === tutorialSteps.length - 1 ? (
            <Link href="/client/dashboard">
              <Button className="gap-2" data-testid="button-finish">
                <CheckCircle2 className="w-4 h-4" />
                Finish Tutorial
              </Button>
            </Link>
          ) : (
            <Button onClick={handleNext} className="gap-2" data-testid="button-next">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
