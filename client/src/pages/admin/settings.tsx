import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User, Lock, Building2, Loader2, Check, Bell, Palette, KeyRound, Delete, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PortalLayout } from "@/components/portal/portal-layout";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme-provider";

export default function AdminSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: "",
  });

  const [businessData, setBusinessData] = useState({
    companyName: "Creative Web Solutions",
    email: "hello@creativeweb.com",
    phone: "(555) 123-4567",
    address: "123 Design Street, Creative City, ST 12345",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailNewClient: true,
    emailPaymentReceived: true,
    emailDocumentSigned: true,
    emailNewMessage: false,
  });

  const [pinSetupMode, setPinSetupMode] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinPassword, setPinPassword] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const { data: pinStatus, refetch: refetchPinStatus } = useQuery({
    queryKey: ["/api/auth/pin-status", user?.email],
    queryFn: async () => {
      if (!user?.email) return { pinEnabled: false };
      const res = await fetch(`/api/auth/pin-status?email=${encodeURIComponent(user.email)}`);
      return res.json();
    },
    enabled: !!user?.email,
  });

  const profileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return apiRequest("PATCH", "/api/admin/profile", data);
    },
    onSuccess: () => {
      if (user) {
        updateUser({
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        });
      }
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      return apiRequest("POST", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Password change failed",
        description: "Please check your current password and try again.",
        variant: "destructive",
      });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (data: { pin: string; password: string }) => {
      return apiRequest("POST", "/api/admin/pin/set", data);
    },
    onSuccess: () => {
      setPinSuccess(true);
      refetchPinStatus();
      setTimeout(() => {
        resetPinSetup();
        toast({
          title: "PIN set successfully",
          description: "You can now use your PIN to log in quickly.",
        });
      }, 1000);
    },
    onError: (error: any) => {
      setPinError(true);
      setTimeout(() => {
        setPinError(false);
      }, 500);
      toast({
        title: "Failed to set PIN",
        description: error.message || "Please check your password and try again.",
        variant: "destructive",
      });
    },
  });

  const disablePinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/pin/disable", {});
    },
    onSuccess: () => {
      refetchPinStatus();
      toast({
        title: "PIN disabled",
        description: "You will now log in with your password only.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to disable PIN",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePinNumberClick = (num: string) => {
    if (pinStep === "enter") {
      if (newPin.length < 5) {
        const updated = newPin + num;
        setNewPin(updated);
        if (updated.length === 5) {
          setTimeout(() => setPinStep("confirm"), 300);
        }
      }
    } else {
      if (confirmPin.length < 5) {
        const updated = confirmPin + num;
        setConfirmPin(updated);
        if (updated.length === 5) {
          if (updated === newPin) {
            setPinStep("enter");
          } else {
            setPinError(true);
            setTimeout(() => {
              setConfirmPin("");
              setPinError(false);
            }, 500);
          }
        }
      }
    }
  };

  const handlePinBackspace = () => {
    if (pinStep === "enter") {
      setNewPin(newPin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setPinError(false);
  };

  const resetPinSetup = () => {
    setPinSetupMode(false);
    setNewPin("");
    setConfirmPin("");
    setPinStep("enter");
    setPinPassword("");
    setPinError(false);
    setPinSuccess(false);
  };

  const handleSetPin = () => {
    if (newPin.length === 5 && confirmPin === newPin && pinPassword) {
      pinMutation.mutate({ pin: newPin, password: pinPassword });
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    passwordMutation.mutate(passwordData);
  };

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and business settings
          </p>
        </div>

        {/* Profile Information */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
              <Button type="submit" disabled={profileMutation.isPending} data-testid="button-save-profile">
                {profileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Update your business details displayed to clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={businessData.companyName}
                  onChange={(e) => setBusinessData({ ...businessData, companyName: e.target.value })}
                  data-testid="input-company-name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessData.email}
                    onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                    data-testid="input-business-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    value={businessData.phone}
                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                    data-testid="input-business-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={businessData.address}
                  onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                  data-testid="input-address"
                />
              </div>
              <Button type="button" data-testid="button-save-business">
                <Check className="w-4 h-4 mr-2" />
                Save Business Info
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose what emails you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Client Added</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new client is created
                </p>
              </div>
              <Switch
                checked={notifications.emailNewClient}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, emailNewClient: checked })
                }
                data-testid="switch-new-client"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Received</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a payment is processed
                </p>
              </div>
              <Switch
                checked={notifications.emailPaymentReceived}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, emailPaymentReceived: checked })
                }
                data-testid="switch-payment-received"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Document Signed</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a client signs a document
                </p>
              </div>
              <Switch
                checked={notifications.emailDocumentSigned}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, emailDocumentSigned: checked })
                }
                data-testid="switch-document-signed"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Messages</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a client sends a message
                </p>
              </div>
              <Switch
                checked={notifications.emailNewMessage}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, emailNewMessage: checked })
                }
                data-testid="switch-new-message"
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  data-testid="input-current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  data-testid="input-confirm-password"
                />
              </div>
              <Button type="submit" disabled={passwordMutation.isPending} data-testid="button-change-password">
                {passwordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* PIN Setup */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Quick Login PIN
            </CardTitle>
            <CardDescription>
              {pinStatus?.pinEnabled
                ? "Your PIN is enabled. You can log in quickly using your 5-digit PIN."
                : "Set up a 5-digit PIN for faster login"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!pinSetupMode ? (
              <div className="space-y-4">
                {pinStatus?.pinEnabled ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">PIN is active</p>
                        <p className="text-sm text-muted-foreground">You can use your PIN to log in</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setPinSetupMode(true)}
                    data-testid="button-setup-pin"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    {pinStatus?.pinEnabled ? "Change PIN" : "Set Up PIN"}
                  </Button>
                  {pinStatus?.pinEnabled && (
                    <Button
                      variant="outline"
                      onClick={() => disablePinMutation.mutate()}
                      disabled={disablePinMutation.isPending}
                      data-testid="button-disable-pin"
                    >
                      {disablePinMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Disable PIN
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {pinStep === "enter" ? "Enter your new 5-digit PIN" : "Confirm your PIN"}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  {[...Array(5)].map((_, i) => {
                    const currentPin = pinStep === "enter" ? newPin : confirmPin;
                    return (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                          i < currentPin.length
                            ? pinSuccess
                              ? 'bg-green-500 scale-110'
                              : pinError
                              ? 'bg-destructive animate-pulse'
                              : 'bg-primary scale-110'
                            : 'bg-muted border-2 border-border'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="h-6 text-center">
                  {pinSuccess && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">PIN set successfully</span>
                    </div>
                  )}
                  {pinError && pinStep === "confirm" && (
                    <div className="flex items-center justify-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">PINs don't match</span>
                    </div>
                  )}
                  {pinMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Setting PIN...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      size="lg"
                      onClick={() => handlePinNumberClick(num.toString())}
                      disabled={pinMutation.isPending || pinSuccess}
                      className="h-14 text-xl font-semibold"
                      data-testid={`button-pin-setup-${num}`}
                    >
                      {num}
                    </Button>
                  ))}
                  
                  <div />
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handlePinNumberClick('0')}
                    disabled={pinMutation.isPending || pinSuccess}
                    className="h-14 text-xl font-semibold"
                    data-testid="button-pin-setup-0"
                  >
                    0
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePinBackspace}
                    disabled={(pinStep === "enter" ? newPin.length : confirmPin.length) === 0 || pinMutation.isPending || pinSuccess}
                    className="h-14"
                    data-testid="button-pin-setup-backspace"
                  >
                    <Delete className="h-5 w-5" />
                  </Button>
                </div>

                {newPin.length === 5 && confirmPin.length === 5 && confirmPin === newPin && (
                  <div className="space-y-4 pt-4 border-t max-w-xs mx-auto">
                    <div className="space-y-2">
                      <Label htmlFor="pinPassword">Confirm with your password</Label>
                      <Input
                        id="pinPassword"
                        type="password"
                        value={pinPassword}
                        onChange={(e) => setPinPassword(e.target.value)}
                        placeholder="Enter your password"
                        data-testid="input-pin-password"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSetPin}
                      disabled={!pinPassword || pinMutation.isPending}
                      data-testid="button-confirm-pin"
                    >
                      {pinMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting PIN...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Set PIN
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={resetPinSetup}
                  disabled={pinMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
