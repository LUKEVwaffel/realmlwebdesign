import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Palette, Building2, Globe, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PortalLayout } from "@/components/portal/portal-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestionnaireData {
  businessDescription: string;
  targetAudience: string;
  primaryGoals: string;
  competitorWebsites: string;
  likedWebsites: string;
  dislikedElements: string;
  preferredColors: string;
  preferredFonts: string;
  layoutPreference: string;
  numPages: string;
  mustHaveFeatures: string;
  additionalNotes: string;
}

const steps = [
  { id: "business", title: "Business Info", icon: Building2 },
  { id: "goals", title: "Goals & Audience", icon: Globe },
  { id: "design", title: "Design Preferences", icon: Palette },
  { id: "features", title: "Features & Content", icon: FileText },
  { id: "review", title: "Review", icon: Sparkles },
];

export default function ClientQuestionnaire() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestionnaireData>({
    businessDescription: "",
    targetAudience: "",
    primaryGoals: "",
    competitorWebsites: "",
    likedWebsites: "",
    dislikedElements: "",
    preferredColors: "",
    preferredFonts: "",
    layoutPreference: "modern",
    numPages: "5-10",
    mustHaveFeatures: "",
    additionalNotes: "",
  });

  const { data: questionnaire, isLoading } = useQuery<any>({
    queryKey: ["/api/client/questionnaire"],
  });

  useEffect(() => {
    if (questionnaire?.responses) {
      setFormData({
        businessDescription: questionnaire.responses.businessDescription || "",
        targetAudience: questionnaire.responses.targetAudience || "",
        primaryGoals: questionnaire.responses.primaryGoals || "",
        competitorWebsites: questionnaire.responses.competitorWebsites || "",
        likedWebsites: questionnaire.responses.likedWebsites || "",
        dislikedElements: questionnaire.responses.dislikedElements || "",
        preferredColors: questionnaire.responses.preferredColors || "",
        preferredFonts: questionnaire.responses.preferredFonts || "",
        layoutPreference: questionnaire.responses.layoutPreference || "modern",
        numPages: questionnaire.responses.numPages || "5-10",
        mustHaveFeatures: questionnaire.responses.mustHaveFeatures || "",
        additionalNotes: questionnaire.responses.additionalNotes || "",
      });
    }
  }, [questionnaire]);

  const saveMutation = useMutation({
    mutationFn: async (data: { responses: QuestionnaireData; status: string }) => {
      const res = await apiRequest("PUT", "/api/client/questionnaire", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/questionnaire"] });
      toast({ title: "Progress saved", description: "Your questionnaire has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { responses: QuestionnaireData; status: string }) => {
      const res = await apiRequest("PUT", "/api/client/questionnaire", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/questionnaire"] });
      toast({ title: "Questionnaire submitted", description: "Thank you! Your responses have been submitted to our team." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      saveMutation.mutate({ responses: formData, status: "in_progress" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate({ responses: formData, status: "completed" });
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateField = (field: keyof QuestionnaireData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (isLoading) {
    return (
      <PortalLayout requiredRole="client">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (questionnaire?.status === "completed") {
    return (
      <PortalLayout requiredRole="client">
        <div className="p-6 max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold mb-2">Questionnaire Completed</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for completing the questionnaire. Our team is reviewing your responses and will use them to create your perfect website.
                </p>
                <Button variant="outline" onClick={() => setCurrentStep(0)} data-testid="button-view-responses">
                  View Your Responses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout requiredRole="client">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-questionnaire-title">
            Website Questionnaire
          </h1>
          <p className="text-muted-foreground mt-1">
            Help us understand your vision for your new website
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : index < currentStep
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                }`}
                data-testid={`step-${step.id}`}
              >
                <step.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep].icon;
                return <StepIcon className="w-5 h-5" />;
              })()}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 0 && "Tell us about your business and what you do"}
              {currentStep === 1 && "Help us understand your goals and target audience"}
              {currentStep === 2 && "Share your design preferences and style"}
              {currentStep === 3 && "Describe the features and content you need"}
              {currentStep === 4 && "Review your responses before submitting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Describe your business</Label>
                  <Textarea
                    value={formData.businessDescription}
                    onChange={(e) => updateField("businessDescription", e.target.value)}
                    placeholder="What does your business do? What products or services do you offer?"
                    className="min-h-24"
                    data-testid="input-business-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>List any competitor websites</Label>
                  <Textarea
                    value={formData.competitorWebsites}
                    onChange={(e) => updateField("competitorWebsites", e.target.value)}
                    placeholder="Enter URLs of competitor websites (one per line)"
                    className="min-h-20"
                    data-testid="input-competitor-websites"
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Who is your target audience?</Label>
                  <Textarea
                    value={formData.targetAudience}
                    onChange={(e) => updateField("targetAudience", e.target.value)}
                    placeholder="Describe your ideal customer or visitor (age, interests, needs, etc.)"
                    className="min-h-24"
                    data-testid="input-target-audience"
                  />
                </div>
                <div className="space-y-2">
                  <Label>What are your primary goals for the website?</Label>
                  <Textarea
                    value={formData.primaryGoals}
                    onChange={(e) => updateField("primaryGoals", e.target.value)}
                    placeholder="e.g., Generate leads, sell products, provide information, build credibility..."
                    className="min-h-24"
                    data-testid="input-primary-goals"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Websites you like (for inspiration)</Label>
                  <Textarea
                    value={formData.likedWebsites}
                    onChange={(e) => updateField("likedWebsites", e.target.value)}
                    placeholder="Enter URLs of websites you like and what you like about them"
                    className="min-h-20"
                    data-testid="input-liked-websites"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elements you dislike or want to avoid</Label>
                  <Textarea
                    value={formData.dislikedElements}
                    onChange={(e) => updateField("dislikedElements", e.target.value)}
                    placeholder="What design elements or features do you want to avoid?"
                    className="min-h-20"
                    data-testid="input-disliked-elements"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred colors</Label>
                    <Input
                      value={formData.preferredColors}
                      onChange={(e) => updateField("preferredColors", e.target.value)}
                      placeholder="e.g., Blue, gold, white"
                      data-testid="input-preferred-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred fonts/style</Label>
                    <Input
                      value={formData.preferredFonts}
                      onChange={(e) => updateField("preferredFonts", e.target.value)}
                      placeholder="e.g., Modern, clean, professional"
                      data-testid="input-preferred-fonts"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Layout preference</Label>
                  <Select
                    value={formData.layoutPreference}
                    onValueChange={(v) => updateField("layoutPreference", v)}
                  >
                    <SelectTrigger data-testid="select-layout-preference">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern & Clean</SelectItem>
                      <SelectItem value="classic">Classic & Traditional</SelectItem>
                      <SelectItem value="bold">Bold & Eye-catching</SelectItem>
                      <SelectItem value="minimal">Minimal & Simple</SelectItem>
                      <SelectItem value="creative">Creative & Unique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Approximate number of pages</Label>
                  <Select
                    value={formData.numPages}
                    onValueChange={(v) => updateField("numPages", v)}
                  >
                    <SelectTrigger data-testid="select-num-pages">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-4">1-4 pages (Small site)</SelectItem>
                      <SelectItem value="5-10">5-10 pages (Medium site)</SelectItem>
                      <SelectItem value="11-20">11-20 pages (Large site)</SelectItem>
                      <SelectItem value="20+">20+ pages (Enterprise)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Must-have features</Label>
                  <Textarea
                    value={formData.mustHaveFeatures}
                    onChange={(e) => updateField("mustHaveFeatures", e.target.value)}
                    placeholder="e.g., Contact form, blog, e-commerce, booking system, gallery..."
                    className="min-h-24"
                    data-testid="input-must-have-features"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional notes or special requirements</Label>
                  <Textarea
                    value={formData.additionalNotes}
                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                    placeholder="Anything else you'd like us to know about your project?"
                    className="min-h-24"
                    data-testid="input-additional-notes"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Please review your responses below. Once submitted, our team will use this information to design your website.
                </p>
                <div className="space-y-4 divide-y">
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Business Info</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><span className="font-medium text-foreground">Description:</span> {formData.businessDescription || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Competitors:</span> {formData.competitorWebsites || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Goals & Audience</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><span className="font-medium text-foreground">Target Audience:</span> {formData.targetAudience || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Primary Goals:</span> {formData.primaryGoals || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Design Preferences</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><span className="font-medium text-foreground">Liked Websites:</span> {formData.likedWebsites || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Colors:</span> {formData.preferredColors || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Style:</span> {formData.preferredFonts || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Layout:</span> {formData.layoutPreference}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Features & Content</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><span className="font-medium text-foreground">Pages:</span> {formData.numPages}</p>
                      <p><span className="font-medium text-foreground">Must-have Features:</span> {formData.mustHaveFeatures || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Additional Notes:</span> {formData.additionalNotes || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-2"
            data-testid="button-prev"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={saveMutation.isPending} className="gap-2" data-testid="button-next">
                {saveMutation.isPending ? "Saving..." : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="gap-2" data-testid="button-submit">
                {submitMutation.isPending ? "Submitting..." : "Submit Questionnaire"}
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
