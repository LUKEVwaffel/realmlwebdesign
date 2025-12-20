import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Sparkles, Loader2, KeyRound, Shield, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginSchema, type LoginInput } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminUsers = [
  { name: "Luke Vetsch", email: "luke@pixelcraft.com", initials: "LV" },
  { name: "Makaio Roos", email: "makaio@pixelcraft.com", initials: "MR" },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "pin">("password");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);
  const [pin, setPin] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
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

  const handleAdminSelect = (adminEmail: string) => {
    setSelectedAdmin(adminEmail);
    form.setValue("email", adminEmail);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-serif font-bold text-2xl">PixelCraft</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your portal</p>
          </div>

          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="admin" className="gap-2" data-testid="tab-admin-login">
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="client" className="gap-2" data-testid="tab-client-login">
                <User className="w-4 h-4" />
                Client
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-serif text-xl">Admin Login</CardTitle>
                  <CardDescription>Select your account to continue</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3">
                    {adminUsers.map((admin) => (
                      <button
                        key={admin.email}
                        type="button"
                        onClick={() => handleAdminSelect(admin.email)}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover-elevate ${
                          selectedAdmin === admin.email
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        data-testid={`button-select-admin-${admin.initials.toLowerCase()}`}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {admin.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1">
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                        {selectedAdmin === admin.email && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedAdmin && (
                    <div className="space-y-4 pt-4 border-t">
                      {loginMode === "password" ? (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                        autoFocus
                                        data-testid="input-admin-password"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
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

                            <Button
                              type="submit"
                              className="w-full"
                              disabled={isLoading}
                              data-testid="button-admin-login"
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

                            {pinEnabled && !checkingPin && (
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setLoginMode("pin")}
                                data-testid="button-switch-to-pin"
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Use PIN instead
                              </Button>
                            )}
                          </form>
                        </Form>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                              Enter your 6-digit PIN
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
                          >
                            Use password instead
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client">
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-serif text-xl">Client Login</CardTitle>
                  <CardDescription>Access your project dashboard</CardDescription>
                </CardHeader>
                <CardContent>
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

                      <div className="flex justify-end">
                        <Link
                          href="/portal/forgot-password"
                          className="text-sm text-primary hover:underline"
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-6">
            This portal is for invited clients only.{" "}
            <Link href="/" className="text-primary hover:underline" data-testid="link-back-home">
              Return to website
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
