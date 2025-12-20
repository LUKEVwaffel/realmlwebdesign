import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border-card-border">
        <CardContent className="pt-8 pb-8 px-6">
          <div className="flex flex-col items-center text-center">
            {/* Icon and Status */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative bg-destructive/10 p-4 rounded-full">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            {/* Error Code */}
            <div className="mb-2">
              <span className="text-7xl font-serif font-bold gradient-text">404</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-serif font-bold text-foreground mb-3">
              Page Not Found
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-6 max-w-sm">
              The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be incorrect.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                variant="default" 
                className="flex-1 gap-2"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={() => setLocation('/')}
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>

            {/* Developer Note */}
            <div className="mt-6 pt-6 border-t border-border w-full">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Search className="h-3 w-3" />
                Developer tip: Check if this route exists in your router
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}