import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Building2, Target, Palette, Sparkles, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { PortalLayout } from "@/components/portal/portal-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestionnaireData {
  businessDescription: string;
  targetAudience: string;
  websiteGoal: string;
  siteSize: string;
  designStyle: string;
  features: string[];
  likedWebsites: string;
  preferredColors: string;
  additionalNotes: string;
}

const steps = [
  { id: "business", title: "Your Business", icon: Building2 },
  { id: "goals", title: "Goals", icon: Target },
  { id: "design", title: "Design", icon: Palette },
  { id: "review", title: "Review", icon: Sparkles },
];

const siteSizeOptions = [
  { 
    value: "small", 
    label: "Small Site", 
    description: "Home, About, Services, Contact",
    pages: "4 pages"
  },
  { 
    value: "medium", 
    label: "Medium Site", 
    description: "Small site + Portfolio, Testimonials, FAQ",
    pages: "7 pages"
  },
  { 
    value: "large", 
    label: "Large Site", 
    description: "Medium site + Blog, Team, Multiple services",
    pages: "10+ pages"
  },
  { 
    value: "not_sure", 
    label: "Not Sure", 
    description: "Let's discuss what's best for you",
    pages: "We'll help!"
  },
];

const designStyleOptions = [
  { 
    value: "professional", 
    label: "Clean & Professional", 
    examples: "Like Apple, Stripe"
  },
  { 
    value: "bold", 
    label: "Bold & Colorful", 
    examples: "Like Nike, Spotify"
  },
  { 
    value: "elegant", 
    label: "Elegant & Minimal", 
    examples: "Like luxury brands"
  },
  { 
    value: "friendly", 
    label: "Friendly & Approachable", 
    examples: "Like local businesses"
  },
  { 
    value: "not_sure", 
    label: "Not Sure", 
    examples: "Surprise me!"
  },
];

const featureOptions = [
  { value: "contact_form", label: "Contact Form" },
  { value: "photo_gallery", label: "Photo Gallery" },
  { value: "booking", label: "Online Booking/Scheduling" },
  { value: "testimonials", label: "Customer Testimonials" },
  { value: "blog", label: "Blog" },
  { value: "store", label: "Online Store" },
  { value: "social_links", label: "Social Media Links" },
  { value: "not_sure", label: "Not sure what I need" },
];

const websiteGoalOptions = [
  { value: "leads", label: "Get people to contact me" },
  { value: "sales", label: "Sell products or services" },
  { value: "info", label: "Provide information about my business" },
  { value: "bookings", label: "Get bookings or appointments" },
  { value: "credibility", label: "Build trust and credibility" },
];

export default function ClientQuestionnaire() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestionnaireData>({
    businessDescription: "",
    targetAudience: "",
    websiteGoal: "",
    siteSize: "",
    designStyle: "",
    features: [],
    likedWebsites: "",
    preferredColors: "",
    additionalNotes: "",
  });

  const { data: questionnaire, isLoading } = useQuery<any>({
    queryKey: ["/api/client/questionnaire"],
  });

  useEffect(() => {
    if (questionnaire?.responses) {
      const r = questionnaire.responses;
      setFormData({
        businessDescription: r.businessDescription || "",
        targetAudience: r.targetAudience || "",
        websiteGoal: r.websiteGoal || r.primaryGoals || "",
        siteSize: r.siteSize || r.numPages || "",
        designStyle: r.designStyle || r.layoutPreference || "",
        features: r.features || [],
        likedWebsites: r.likedWebsites || "",
        preferredColors: r.preferredColors || "",
        additionalNotes: r.additionalNotes || "",
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
      toast({ title: "Questionnaire submitted", description: "Thank you! We'll be in touch soon to discuss your project." });
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

  const updateField = (field: keyof QuestionnaireData, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleFeature = (feature: string) => {
    const current = formData.features;
    if (current.includes(feature)) {
      updateField("features", current.filter(f => f !== feature));
    } else {
      updateField("features", [...current, feature]);
    }
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
                  Thank you! Our team is reviewing your responses and will use them to create your perfect website.
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
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-questionnaire-title">
            Tell Us About Your Project
          </h1>
          <p className="text-muted-foreground mt-1">
            Just a few quick questions to help us understand your vision
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
              {currentStep === 0 && "Tell us what you do and who you serve"}
              {currentStep === 1 && "Help us understand what you want from your website"}
              {currentStep === 2 && "Pick a look and feel - no wrong answers!"}
              {currentStep === 3 && "Review your responses before submitting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>What does your business do?</Label>
                  <Textarea
                    value={formData.businessDescription}
                    onChange={(e) => updateField("businessDescription", e.target.value)}
                    placeholder="Tell us about your business in a few sentences..."
                    className="min-h-24"
                    data-testid="input-business-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Who are you trying to reach?</Label>
                  <Textarea
                    value={formData.targetAudience}
                    onChange={(e) => updateField("targetAudience", e.target.value)}
                    placeholder="Describe your ideal customer (e.g., small business owners, parents, young professionals...)"
                    className="min-h-20"
                    data-testid="input-target-audience"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Goals */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>What's the main goal of your website?</Label>
                  <div className="grid gap-2">
                    {websiteGoalOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("websiteGoal", option.value)}
                        className={`p-4 rounded-md border text-left transition-colors ${
                          formData.websiteGoal === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`goal-${option.value}`}
                      >
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What size website do you need?</Label>
                  <div className="grid gap-2">
                    {siteSizeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("siteSize", option.value)}
                        className={`p-4 rounded-md border text-left transition-colors ${
                          formData.siteSize === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`size-${option.value}`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="font-medium">{option.label}</span>
                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">{option.pages}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What features do you need?</Label>
                  <p className="text-sm text-muted-foreground">Select all that apply</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {featureOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          formData.features.includes(option.value)
                            ? "border-primary bg-primary/5"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`feature-${option.value}`}
                      >
                        <Checkbox
                          checked={formData.features.includes(option.value)}
                          onCheckedChange={() => toggleFeature(option.value)}
                        />
                        <span className={option.value === "not_sure" ? "text-muted-foreground italic" : ""}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Design */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>What style fits your brand?</Label>
                  <div className="grid gap-2">
                    {designStyleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("designStyle", option.value)}
                        className={`p-4 rounded-md border text-left transition-colors ${
                          formData.designStyle === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`style-${option.value}`}
                      >
                        <div>
                          <span className="font-medium">{option.label}</span>
                          <p className="text-sm text-muted-foreground mt-1">{option.examples}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Any websites you like for inspiration?</Label>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  <Textarea
                    value={formData.likedWebsites}
                    onChange={(e) => updateField("likedWebsites", e.target.value)}
                    placeholder="Share any website links you like - doesn't have to be competitors!"
                    className="min-h-20"
                    data-testid="input-liked-websites"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    Not sure? That's okay - we can discuss this together!
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Preferred colors?</Label>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  <Input
                    value={formData.preferredColors}
                    onChange={(e) => updateField("preferredColors", e.target.value)}
                    placeholder="e.g., Blue, gold, white - or leave blank if unsure"
                    data-testid="input-preferred-colors"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Anything else we should know?</Label>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  <Textarea
                    value={formData.additionalNotes}
                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                    placeholder="Any special requirements, deadlines, or things you'd like to discuss?"
                    className="min-h-20"
                    data-testid="input-additional-notes"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Review your responses below. After you submit, we'll reach out to discuss your project further.
                </p>
                <div className="space-y-4 divide-y">
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Your Business</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><span className="font-medium text-foreground">What you do:</span> {formData.businessDescription || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Who you serve:</span> {formData.targetAudience || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Website Goals</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><span className="font-medium text-foreground">Main goal:</span> {websiteGoalOptions.find(o => o.value === formData.websiteGoal)?.label || "Not selected"}</p>
                      <p><span className="font-medium text-foreground">Site size:</span> {siteSizeOptions.find(o => o.value === formData.siteSize)?.label || "Not selected"}</p>
                      <p><span className="font-medium text-foreground">Features:</span> {formData.features.length > 0 ? formData.features.map(f => featureOptions.find(o => o.value === f)?.label).join(", ") : "None selected"}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Design Preferences</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><span className="font-medium text-foreground">Style:</span> {designStyleOptions.find(o => o.value === formData.designStyle)?.label || "Not selected"}</p>
                      <p><span className="font-medium text-foreground">Inspiration:</span> {formData.likedWebsites || "Not provided"}</p>
                      <p><span className="font-medium text-foreground">Colors:</span> {formData.preferredColors || "Not provided"}</p>
                      {formData.additionalNotes && (
                        <p><span className="font-medium text-foreground">Additional notes:</span> {formData.additionalNotes}</p>
                      )}
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
                {submitMutation.isPending ? "Submitting..." : "Submit"}
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
