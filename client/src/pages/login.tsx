import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, KeyRound, Shield, User, Delete, CheckCircle2, XCircle, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { loginSchema, type LoginInput } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminUsers = [
  { name: "Luke Vetsch", email: "luke@mlwebdesign.com", initials: "LV" },
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
        const hasPinEnabled = data.pinEnabled || false;
        setPinEnabled(hasPinEnabled);
        // Auto-switch to PIN mode if PIN is enabled
        if (hasPinEnabled && loginMode === "select") {
          setLoginMode("pin");
        } else if (!hasPinEnabled && loginMode === "select") {
          setLoginMode("password");
        }
      } catch {
        setPinEnabled(false);
        if (loginMode === "select") {
          setLoginMode("password");
        }
      } finally {
        setCheckingPin(false);
      }
    };

    checkPinStatus();
  }, [selectedAdmin]);

  const handleAdminSelect = (admin: typeof adminUsers[0]) => {
    setSelectedAdmin(admin);
    form.setValue("email", admin.email);
    setLoginMode("select"); // Will be updated by the effect after checking PIN status
    setPin("");
    setPinError(false);
    setPinSuccess(false);
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
            setLocation("/beta-review");
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
            setLocation("/beta-review");
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
            description: "Your account has been closed. If you have questions, please contact us at hello@mlwebdesign.com.",
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
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ backgroundColor: "#0D0E10" }}
    >
      {/* Back to ML WebDesign */}
      <div className="absolute top-4 left-4 z-50">
        <a
          href="https://mlwebdesign.net"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-white/70 transition-colors"
          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </a>
      </div>

      {/* Animated grid background — full page */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Slow scanline sweep */}
        <motion.div
          className="absolute left-0 right-0 h-40 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.04) 50%, transparent 100%)",
          }}
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
        />
      </div>

      {/* Left panel — Duo image */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 relative border-r border-white/5">
        {/* Ambient glow behind logo */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo floats in then bobs */}
        <motion.img
          src="/duo-portal.png"
          alt="DUO Client Portal"
          className="relative z-10 w-[500px] max-w-[85%] object-contain select-none"
          draggable={false}
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Floating bob after entrance */}
        <motion.div
          className="absolute z-10 w-[500px] max-w-[85%] pointer-events-none"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <motion.p
          className="relative z-10 mt-4 text-white/30 text-xs tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          Powered by ML WebDesign
        </motion.p>

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(13,14,16,0.6) 100%)" }}
        />
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-col flex-1 items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile logo */}
        <motion.div
          className="flex items-center gap-3 mb-8 lg:hidden"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/newlogo.png" alt="ML WebDesign" className="w-9 h-9 object-contain" />
          <span className="text-white font-semibold">Web Design</span>
        </motion.div>

        <div className="w-full max-w-md">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
              Welcome back
            </h1>
            <p className="text-white/40 text-sm">Sign in to your portal to continue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 border border-white/10">
              <TabsTrigger value="client" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-client-login">
                <User className="w-4 h-4" />
                Client
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-admin-login">
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Client Login</CardTitle>
                  <CardDescription className="text-white/40">Access your project dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                {...field}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
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
                              <FormLabel className="text-white/70">Password</FormLabel>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto py-0 px-2 text-xs text-white/40 hover:text-white/70"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <><EyeOff className="h-3 w-3 mr-1" />Hide</> : <><Eye className="h-3 w-3 mr-1" />Show</>}
                              </Button>
                            </div>
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                                data-testid="input-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="text-right">
                        <Link href="/portal/forgot-password" className="text-xs text-primary/80 hover:text-primary">
                          Forgot password?
                        </Link>
                      </div>
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} data-testid="button-login">
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="admin">
              <Card className="bg-white/5 border-white/10">
                <AnimatePresence mode="wait">
                {!selectedAdmin ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Select Account</CardTitle>
                      <CardDescription className="text-white/40">Choose your account to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {adminUsers.map((admin, i) => (
                        <motion.button
                          key={admin.email}
                          type="button"
                          onClick={() => handleAdminSelect(admin)}
                          className="w-full flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/3 transition-colors hover:border-primary/50 hover:bg-white/8"
                          data-testid={`button-select-admin-${admin.initials.toLowerCase()}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.3 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-base">
                              {admin.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1">
                            <p className="font-medium text-white">{admin.name}</p>
                            <p className="text-xs text-white/40">{admin.email}</p>
                          </div>
                        </motion.button>
                      ))}
                    </CardContent>
                  </motion.div>
                ) : loginMode === "pin" ? (
                  <motion.div
                    key="pin"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardHeader className="text-center pt-4 pb-2">
                      <div className="flex items-center justify-center gap-3 mb-1">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                            {selectedAdmin.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <CardTitle className="text-white text-base leading-tight">{selectedAdmin.name}</CardTitle>
                          <CardDescription className="text-white/40 text-xs">Enter your PIN</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      {/* PIN dots + status in one row */}
                      <div className="flex items-center justify-center gap-3">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                              i < pin.length
                                ? pinSuccess ? 'bg-green-500 scale-110' : pinError ? 'bg-destructive animate-pulse' : 'bg-primary scale-110'
                                : 'bg-white/10 border border-white/20'
                            }`}
                          />
                        ))}
                        <div className="ml-2 h-4">
                          {pinSuccess && <div className="flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /><span className="text-xs">Granted</span></div>}
                          {pinError && <div className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" /><span className="text-xs">Incorrect</span></div>}
                          {isVerifying && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
                        </div>
                      </div>
                      {/* Compact numpad */}
                      <div className="grid grid-cols-3 gap-2">
                        {[1,2,3,4,5,6,7,8,9].map((num) => (
                          <Button key={num} variant="outline" onClick={() => handleNumberClick(num.toString())} disabled={isVerifying || pinSuccess} className="h-10 text-base font-semibold bg-white/5 border-white/10 text-white hover:bg-white/10" data-testid={`button-pin-${num}`}>{num}</Button>
                        ))}
                        <div />
                        <Button variant="outline" onClick={() => handleNumberClick('0')} disabled={isVerifying || pinSuccess} className="h-10 text-base font-semibold bg-white/5 border-white/10 text-white hover:bg-white/10" data-testid="button-pin-0">0</Button>
                        <Button variant="outline" onClick={handleBackspace} disabled={pin.length === 0 || isVerifying || pinSuccess} className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10" data-testid="button-pin-backspace"><Delete className="h-4 w-4" /></Button>
                      </div>
                      {/* Bottom actions in one row */}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { resetPinEntry(); setLoginMode("password"); }} disabled={isVerifying} className="flex-1 text-xs text-white/40 hover:text-white">
                          <KeyRound className="h-3 w-3 mr-1" />Password
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { resetPinEntry(); setSelectedAdmin(null); }} disabled={isVerifying} className="flex-1 text-xs text-white/30 hover:text-white/50">
                          Switch account
                        </Button>
                      </div>
                    </CardContent>
                  </motion.div>
                ) : (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardHeader className="text-center pb-4">
                      <Avatar className="h-14 w-14 mx-auto mb-3">
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg">
                          {selectedAdmin.initials}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-white text-lg">{selectedAdmin.name}</CardTitle>
                      <CardDescription className="text-white/40">Enter your password to continue</CardDescription>
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
                                  <FormLabel className="text-white/70">Password</FormLabel>
                                  <Button type="button" variant="ghost" size="sm" className="h-auto py-0 px-2 text-xs text-white/40 hover:text-white/70" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <><EyeOff className="h-3 w-3 mr-1" />Hide</> : <><Eye className="h-3 w-3 mr-1" />Show</>}
                                  </Button>
                                </div>
                                <FormControl>
                                  <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field} autoFocus className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-admin-password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} data-testid="button-admin-login">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
                          </Button>
                          {pinEnabled && !checkingPin && (
                            <Button type="button" variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => setLoginMode("pin")} data-testid="button-switch-to-pin">
                              <KeyRound className="h-4 w-4 mr-2" />Use PIN instead
                            </Button>
                          )}
                          <Button type="button" variant="ghost" className="w-full text-white/30 hover:text-white/50" onClick={() => setSelectedAdmin(null)}>
                            Switch account
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </motion.div>
                )}
                </AnimatePresence>
              </Card>
            </TabsContent>
          </Tabs>
          </motion.div>
        </div>

        <motion.p
          className="mt-8 text-white/20 text-xs tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          ML WebDesign © {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  );
}
