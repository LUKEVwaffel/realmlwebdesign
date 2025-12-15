import { Sparkles, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";

export function PublicFooter() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif font-bold text-xl">PixelCraft</span>
            </div>
            <p className="text-muted-foreground max-w-md mb-4">
              We create stunning, modern websites that help businesses grow online. 
              Our team combines beautiful design with powerful functionality.
            </p>
            <p className="text-sm text-muted-foreground">
              We work by invitation. Interested? Let's chat!
            </p>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-home">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-portfolio">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/portal/login" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-login">
                  Client Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@pixelcraft.studio" className="hover:text-foreground transition-colors" data-testid="link-email">
                  hello@pixelcraft.studio
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <a href="tel:+15551234567" className="hover:text-foreground transition-colors" data-testid="link-phone">
                  (555) 123-4567
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PixelCraft Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
