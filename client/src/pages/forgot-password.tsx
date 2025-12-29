import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Mail, CheckCircle, KeyRound, Lock } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/lib/theme-provider";
import duoLogoLight from "@assets/ChatGPT_Image_Dec_29,_2025,_07_49_10_AM_1767014379495.png";
import duoLogoDark from "@assets/ChatGPT_Image_Dec_29,_2025,_07_56_01_AM_1767014379497.png";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d{6}$/, "Code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailInput = z.infer<typeof emailSchema>;
type ResetInput = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const onEmailSubmit = async (data: EmailInput) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", data);
      setEmail(data.email);
      setStep("code");
      toast({
        title: "Code Sent",
        description: "Check your email for the 6-digit reset code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetInput) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/verify-reset-code", {
        email,
        code: data.code,
        newPassword: data.newPassword,
      });
      setStep("success");
      toast({
        title: "Password Reset",
        description: "Your password has been successfully reset.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      toast({
        title: "Code Sent",
        description: "A new reset code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src={isDark ? duoLogoDark : duoLogoLight} 
              alt="DUO"
              className="h-14 w-auto object-contain"
            />
          </Link>
          <ThemeToggle />
        </div>

        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="font-serif text-2xl">
              {step === "email" && "Reset Password"}
              {step === "code" && "Enter Reset Code"}
              {step === "success" && "Password Reset"}
            </CardTitle>
            <CardDescription>
              {step === "email" && "Enter your email address and we'll send you a 6-digit reset code."}
              {step === "code" && `A reset code was sent to ${email}`}
              {step === "success" && "Your password has been successfully reset."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="pl-10"
                              {...field}
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-send-code"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/portal/login"
                      className="text-sm text-muted-foreground hover:text-foreground"
                      data-testid="link-back-to-login"
                    >
                      <ArrowLeft className="inline w-4 h-4 mr-1" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              </Form>
            )}

            {step === "code" && (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6-Digit Code</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="123456"
                              maxLength={6}
                              className="pl-10 text-center text-xl tracking-widest font-mono"
                              {...field}
                              data-testid="input-code"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="New password"
                              className="pl-10"
                              {...field}
                              data-testid="input-new-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Confirm password"
                              className="pl-10"
                              {...field}
                              data-testid="input-confirm-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-reset-password"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="button-change-email"
                    >
                      <ArrowLeft className="inline w-4 h-4 mr-1" />
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={isLoading}
                      className="text-primary hover:underline disabled:opacity-50"
                      data-testid="button-resend-code"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              </Form>
            )}

            {step === "success" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Password Updated!</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  You can now log in with your new password.
                </p>
                <Link href="/portal/login">
                  <Button data-testid="button-go-to-login">
                    Go to Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
