import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Sparkles, Loader2, KeyRound, Shield, User, Delete, CheckCircle2, XCircle, Lock } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminUsers = [
  { name: "Luke Vetsch", email: "luke@pixelcraft.com", initials: "LV" },
  { name: "Makaio Roos", email: "makaio@pixelcraft.com", initials: "MR" },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"select" | "password" | "pin">("select");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);
  const [pin, setPin] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<typeof adminUsers[0] | null>(null);
  const [pinError, setPinError] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
      if (!selectedAdmin) {
        setPinEnabled(false);
        return;
      }

      setCheckingPin(true);
      try {
        const response = await fetch(`/api/auth/pin-status?email=${encodeURIComponent(selectedAdmin.email)}`);
        const data = await response.json();
        setPinEnabled(data.pinEnabled || false);
      } catch {
        setPinEnabled(false);
      } finally {
        setCheckingPin(false);
      }
    };

    checkPinStatus();
  }, [selectedAdmin]);

  const handleAdminSelect = (admin: typeof adminUsers[0]) => {
    setSelectedAdmin(admin);
    form.setValue("email", admin.email);
    setLoginMode("select");
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 5 && !isVerifying && !pinSuccess) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError(false);

      if (newPin.length === 5) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setPinError(false);
  };

  const verifyPin = async (pinToVerify: string) => {
    if (!selectedAdmin) return;
    
    setIsVerifying(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/pin-login", {
        email: selectedAdmin.email,
        pin: pinToVerify,
      });
      const result = await response.json();

      if (result.token && result.user) {
        setPinSuccess(true);
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
        }, 800);
      }
    } catch (error: any) {
      setPinError(true);
      setTimeout(() => {
        setPin("");
        setPinError(false);
      }, 600);
    } finally {
      setIsVerifying(false);
    }
  };

  const resetPinEntry = () => {
    setPin("");
    setPinError(false);
    setPinSuccess(false);
    setLoginMode("select");
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
      const errorText = error.message || "Invalid email or password";
      
      if (errorText.includes("Account closed")) {
        try {
          const jsonPart = errorText.substring(errorText.indexOf("{"));
          const parsed = JSON.parse(jsonPart);
          toast({
            title: "Account Closed",
            description: parsed.message || "Your account has been closed. Please contact us for assistance.",
            variant: "default",
            duration: 10000,
          });
        } catch {
          toast({
            title: "Account Closed",
            description: "Your account has been closed. If you have questions, please contact us at hello@pixelcraft.design.",
            variant: "default",
            duration: 10000,
          });
        }
      } else {
        toast({
          title: "Login failed",
          description: errorText.includes(":") ? errorText.split(":").slice(1).join(":").trim() : errorText,
          variant: "destructive",
        });
      }
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
                {!selectedAdmin ? (
                  <>
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                        <div className="relative bg-primary/10 p-4 rounded-full inline-block">
                          <Lock className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="font-serif text-xl">Select Account</CardTitle>
                      <CardDescription>Choose your account to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {adminUsers.map((admin) => (
                        <button
                          key={admin.email}
                          type="button"
                          onClick={() => handleAdminSelect(admin)}
                          className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-border transition-all hover-elevate hover:border-primary/50"
                          data-testid={`button-select-admin-${admin.initials.toLowerCase()}`}
                        >
                          <Avatar className="h-14 w-14">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                              {admin.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1">
                            <p className="font-medium text-lg">{admin.name}</p>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </>
                ) : loginMode === "pin" ? (
                  <>
                    <CardHeader className="text-center pb-6">
                      <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                          {selectedAdmin.initials}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl font-serif">{selectedAdmin.name}</CardTitle>
                      <CardDescription>Enter your PIN</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="flex justify-center gap-4">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-200 ${
                              i < pin.length
                                ? pinSuccess
                                  ? 'bg-green-500 scale-110'
                                  : pinError
                                  ? 'bg-destructive animate-pulse'
                                  : 'bg-primary scale-110'
                                : 'bg-muted border-2 border-border'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="h-6 text-center">
                        {pinSuccess && (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Access granted</span>
                          </div>
                        )}
                        {pinError && (
                          <div className="flex items-center justify-center gap-2 text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Incorrect PIN</span>
                          </div>
                        )}
                        {isVerifying && (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Verifying...</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <Button
                            key={num}
                            variant="outline"
                            size="lg"
                            onClick={() => handleNumberClick(num.toString())}
                            disabled={isVerifying || pinSuccess}
                            className="h-14 text-xl font-semibold"
                            data-testid={`button-pin-${num}`}
                          >
                            {num}
                          </Button>
                        ))}
                        
                        <div />
                        
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleNumberClick('0')}
                          disabled={isVerifying || pinSuccess}
                          className="h-14 text-xl font-semibold"
                          data-testid="button-pin-0"
                        >
                          0
                        </Button>

                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleBackspace}
                          disabled={pin.length === 0 || isVerifying || pinSuccess}
                          className="h-14"
                          data-testid="button-pin-backspace"
                        >
                          <Delete className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            resetPinEntry();
                            setLoginMode("password");
                          }}
                          disabled={isVerifying}
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Use password instead
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            resetPinEntry();
                            setSelectedAdmin(null);
                          }}
                          disabled={isVerifying}
                          className="text-muted-foreground"
                        >
                          Switch account
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader className="text-center pb-4">
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                          {selectedAdmin.initials}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="font-serif text-xl">{selectedAdmin.name}</CardTitle>
                      <CardDescription>Enter your password to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between">
                                  <FormLabel>Password</FormLabel>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto py-0 px-2 text-xs text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <>
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-3 w-3 mr-1" />
                                        Show
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <FormControl>
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    {...field}
                                    autoFocus
                                    data-testid="input-admin-password"
                                  />
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

                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => setSelectedAdmin(null)}
                          >
                            Switch account
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </>
                )}
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
                            <div className="flex items-center justify-between">
                              <FormLabel>Password</FormLabel>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto py-0 px-2 text-xs text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Show
                                  </>
                                )}
                              </Button>
                            </div>
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                data-testid="input-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="text-right">
                        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
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
        </div>
      </main>

      <footer className="text-center p-4 text-sm text-muted-foreground">
        <p>PixelCraft Design - Crafting Digital Excellence</p>
      </footer>
    </div>
  );
}
