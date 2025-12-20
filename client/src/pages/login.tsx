import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Sparkles, Loader2, KeyRound, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginSchema, type LoginInput } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "pin">("password");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);
  const [pin, setPin] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const email = form.watch("email");

  // Check if PIN is enabled for this email (admin only)
  useEffect(() => {
    const checkPinStatus = async () => {
      if (!email || !email.includes("@")) {
        setPinEnabled(false);
        return;
      }

      setCheckingPin(true);
      try {
        const response = await fetch(`/api/auth/pin-status?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setPinEnabled(data.pinEnabled || false);
      } catch {
        setPinEnabled(false);
      } finally {
        setCheckingPin(false);
      }
    };

    const timeoutId = setTimeout(checkPinStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handlePinLogin = async () => {
    if (pin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 6-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/pin-login", {
        email,
        pin,
      });
      const result = await response.json();

      if (result.token && result.user) {
        login(result.token, result.user);
        
        toast({
          title: "Welcome back!",
          description: `Signed in with PIN`,
        });

        setTimeout(() => {
          if (result.user.mustChangePassword) {
            setLocation("/portal/change-password");
          } else if (result.user.role === "admin") {
            setLocation("/admin/dashboard");
          } else {
            setLocation("/client/dashboard");
          }
        }, 100);
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid PIN",
        variant: "destructive",
      });
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();

      if (result.token && result.user) {
        login(result.token, result.user);
        
        toast({
          title: "Welcome back!",
          description: `Logged in as ${result.user.firstName}`,
        });

        setTimeout(() => {
          if (result.user.mustChangePassword) {
            setLocation("/portal/change-password");
          } else if (result.user.role === "admin") {
            setLocation("/admin/dashboard");
          } else {
            setLocation("/client/dashboard");
          }
        }, 100);
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif font-bold text-xl">PixelCraft</span>
            </Link>
            <ThemeToggle />
          </div>

          <Card className="border-border/50">
            <CardHeader className="space-y-1">
              <CardTitle className="font-serif text-2xl">
                {loginMode === "pin" ? "Quick Sign In" : "Sign In"}
              </CardTitle>
              <CardDescription>
                {loginMode === "pin" 
                  ? "Enter your 6-digit PIN for quick access."
                  : "Enter your credentials to access your dashboard."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginMode === "password" ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                data-testid="input-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {pinEnabled && !checkingPin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-sm"
                          onClick={() => setLoginMode("pin")}
                          data-testid="button-switch-to-pin"
                        >
                          <KeyRound className="h-4 w-4 mr-1" />
                          Use PIN instead
                        </Button>
                      )}
                      <Link
                        href="/portal/forgot-password"
                        className="text-sm text-primary hover:underline ml-auto"
                        data-testid="link-forgot-password"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Signing in as <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={pin}
                      onChange={setPin}
                      data-testid="input-pin"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="w-full"
                    disabled={isLoading || pin.length !== 6}
                    onClick={handlePinLogin}
                    data-testid="button-pin-login"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Sign In with PIN"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setLoginMode("password");
                      setPin("");
                    }}
                    data-testid="button-switch-to-password"
                  >
                    Use password instead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            This portal is for invited clients only.{" "}
            <Link href="/" className="text-primary hover:underline" data-testid="link-back-home">
              Return to website
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&h=1080&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-background/50 to-background/90" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <h2 className="font-serif text-3xl font-bold mb-4">
              Welcome to Your Project Portal
            </h2>
            <p className="text-muted-foreground">
              Track your project progress, make payments, sign documents, 
              and collaborate with our team all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
