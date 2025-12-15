import { Link } from "wouter";
import { ArrowRight, Code, Palette, Zap, Globe, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

const services = [
  {
    icon: Globe,
    title: "New Websites",
    description: "Custom-built websites tailored to your brand and business goals.",
  },
  {
    icon: Palette,
    title: "Website Redesign",
    description: "Transform your outdated website into a modern, high-converting experience.",
  },
  {
    icon: Zap,
    title: "Landing Pages",
    description: "High-converting landing pages designed to capture leads and drive sales.",
  },
  {
    icon: Code,
    title: "E-commerce",
    description: "Online stores that make selling your products easy and delightful.",
  },
];

const portfolioPreview = [
  {
    id: "1",
    businessName: "Artisan Coffee Co.",
    industry: "Food & Beverage",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop",
  },
  {
    id: "2",
    businessName: "Urban Fitness Studio",
    industry: "Health & Fitness",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
  },
  {
    id: "3",
    businessName: "Bloom Interior Design",
    industry: "Interior Design",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Professional Web Design</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
            Websites That
            <span className="block gradient-text">Drive Results</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10" data-testid="text-hero-subtitle">
            We create stunning, modern websites that help your business stand out 
            and convert visitors into customers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/portfolio">
              <Button size="lg" className="gap-2" data-testid="button-view-work">
                View Our Work
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#services">
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        <a
          href="#services"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
          data-testid="link-scroll-indicator"
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </a>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-services-title">
              What We Do
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We offer comprehensive web design services to help your business succeed online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="border-border/50 hover-elevate" data-testid={`card-service-${index}`}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif font-semibold text-lg mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-portfolio-title">
              Recent Work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take a look at some of the websites we've crafted for our clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioPreview.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-border/50"
                data-testid={`card-portfolio-${item.id}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.businessName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-xs uppercase tracking-wider text-primary font-medium">
                    {item.industry}
                  </span>
                  <h3 className="font-serif font-semibold text-lg text-foreground">
                    {item.businessName}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-view-portfolio">
                View Full Portfolio
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6" data-testid="text-why-us-title">
                Why Work With Us?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We're not just web designers - we're your partners in building a successful online presence.
              </p>

              <ul className="space-y-4">
                {[
                  "Custom designs tailored to your brand",
                  "Mobile-responsive and fast-loading websites",
                  "SEO-optimized for better search rankings",
                  "Ongoing support and maintenance",
                  "Clear communication throughout the process",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border/50">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop"
                  alt="Our team at work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-6 shadow-lg">
                <div className="text-3xl font-serif font-bold text-primary">50+</div>
                <div className="text-muted-foreground text-sm">Happy Clients</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-border/50 overflow-hidden">
            <div className="relative p-8 sm:p-12 lg:p-16">
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=600&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="relative z-10 text-center">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-cta-title">
                  Ready to Get Started?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  We work by invitation. If you're interested in working together, 
                  reach out and let's discuss your project.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a href="mailto:hello@pixelcraft.studio">
                    <Button size="lg" className="gap-2" data-testid="button-contact-email">
                      Email Us
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                  <a href="tel:+15551234567" className="text-muted-foreground hover:text-foreground transition-colors">
                    or call (555) 123-4567
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
