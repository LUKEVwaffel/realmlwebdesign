import { Link } from "wouter";
import { ArrowRight, Code, Palette, Zap, Globe, CheckCircle, ChevronDown, Sparkles, Users, Clock, Award, Star, MousePointer, Layers, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

const services = [
  {
    icon: Globe,
    title: "Custom Websites",
    description: "Bespoke designs that capture your brand essence and convert visitors into customers.",
    features: ["Responsive Design", "SEO Optimized", "Fast Loading"],
  },
  {
    icon: Palette,
    title: "Brand Refresh",
    description: "Transform your digital presence with a modern redesign that stands out from competitors.",
    features: ["UI/UX Audit", "Visual Upgrade", "Content Strategy"],
  },
  {
    icon: MousePointer,
    title: "Landing Pages",
    description: "High-converting pages designed to capture leads and maximize your marketing ROI.",
    features: ["A/B Testing", "Analytics", "Lead Capture"],
  },
  {
    icon: Layers,
    title: "E-commerce",
    description: "Online stores that make shopping delightful and checkout seamless for your customers.",
    features: ["Payment Integration", "Inventory Sync", "Mobile First"],
  },
];

const process = [
  {
    step: "01",
    title: "Discovery",
    description: "We dive deep into your business, goals, and audience to create a strategic foundation.",
  },
  {
    step: "02",
    title: "Design",
    description: "Our designers craft stunning visuals that bring your brand to life across every pixel.",
  },
  {
    step: "03",
    title: "Develop",
    description: "Clean, performant code powers your site with speed and reliability built-in.",
  },
  {
    step: "04",
    title: "Launch",
    description: "We handle deployment, testing, and optimization so you go live with confidence.",
  },
];

const portfolioPreview = [
  {
    id: "1",
    businessName: "Artisan Coffee Co.",
    industry: "Food & Beverage",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop",
    result: "+180% online orders",
  },
  {
    id: "2",
    businessName: "Urban Fitness Studio",
    industry: "Health & Fitness",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
    result: "+250% memberships",
  },
  {
    id: "3",
    businessName: "Bloom Interior Design",
    industry: "Interior Design",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop",
    result: "+90% inquiries",
  },
];

const stats = [
  { value: "50+", label: "Happy Clients" },
  { value: "120+", label: "Projects Delivered" },
  { value: "98%", label: "Client Retention" },
  { value: "5.0", label: "Average Rating", icon: Star },
];

const testimonials = [
  {
    quote: "They transformed our online presence completely. The new website has been a game-changer for our business.",
    author: "Sarah Chen",
    role: "CEO, Bloom Interior",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    quote: "Professional, creative, and incredibly responsive. They delivered beyond our expectations.",
    author: "Marcus Johnson",
    role: "Founder, Urban Fitness",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    quote: "Our conversion rate doubled within the first month. Best investment we've made for our brand.",
    author: "Emma Rodriguez",
    role: "Owner, Artisan Coffee",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
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
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm" data-testid="badge-hero">
            <Sparkles className="w-4 h-4 mr-2" />
            Premium Web Design Studio
          </Badge>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]" data-testid="text-hero-title">
            Websites That
            <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Drive Results
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed" data-testid="text-hero-subtitle">
            We craft stunning, high-performance websites that elevate your brand 
            and turn visitors into loyal customers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/portfolio">
              <Button size="lg" className="gap-2" data-testid="button-view-work">
                View Our Work
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                About Us
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.icon && <stat.icon className="w-5 h-5 text-primary fill-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
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
      <section id="services" className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4">Our Services</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-services-title">
              Everything You Need to
              <span className="block text-primary">Succeed Online</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From concept to launch, we provide comprehensive web design services 
              tailored to your unique business needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group border-border/50 hover-elevate overflow-hidden" data-testid={`card-service-${index}`}>
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-xl mb-3">{service.title}</h3>
                      <p className="text-muted-foreground mb-4">{service.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {service.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4">Our Process</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-process-title">
              From Idea to
              <span className="block text-primary">Reality</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A proven approach that delivers exceptional results, every time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((item, index) => (
              <div key={index} className="relative" data-testid={`process-step-${index}`}>
                <div className="text-7xl font-serif font-bold text-primary/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-12">
                  <h3 className="font-serif font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-16 right-0 w-12 border-t-2 border-dashed border-border translate-x-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4">Our Work</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-portfolio-title">
              Featured
              <span className="block text-primary">Projects</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real results for real businesses. See how we've helped our clients succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioPreview.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-border/50"
                data-testid={`card-portfolio-${item.id}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.businessName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <Badge variant="secondary" className="mb-2">
                    {item.industry}
                  </Badge>
                  <h3 className="font-serif font-bold text-xl text-foreground mb-1">
                    {item.businessName}
                  </h3>
                  <p className="text-sm text-primary font-medium">{item.result}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-view-portfolio">
                View Full Portfolio
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-testimonials-title">
              What Our Clients
              <span className="block text-primary">Say About Us</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50" data-testid={`testimonial-${index}`}>
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-primary fill-primary" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Why Choose Us</Badge>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-8" data-testid="text-why-us-title">
                Your Partner in
                <span className="block text-primary">Digital Success</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                We're not just designers - we're strategic partners committed to your growth.
              </p>

              <ul className="space-y-6">
                {[
                  { icon: Palette, text: "Custom designs tailored to your brand identity" },
                  { icon: Zap, text: "Lightning-fast, mobile-responsive websites" },
                  { icon: Award, text: "SEO-optimized for better search rankings" },
                  { icon: Users, text: "Dedicated support and ongoing maintenance" },
                  { icon: Clock, text: "Clear communication and on-time delivery" },
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-lg">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-border/50">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop"
                  alt="Our team at work"
                  className="w-full h-full object-cover"
                />
              </div>
              <Card className="absolute -bottom-8 -left-8 shadow-xl border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Rocket className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <div className="font-serif text-3xl font-bold">120+</div>
                      <div className="text-muted-foreground">Projects Launched</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardContent className="p-12 sm:p-16 lg:p-20">
              <div className="text-center">
                <Badge variant="secondary" className="mb-6">Get Started</Badge>
                <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-cta-title">
                  Ready to Transform
                  <span className="block text-primary">Your Online Presence?</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                  We work with select clients to deliver exceptional results. 
                  Let's discuss how we can help your business grow.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a href="mailto:hello@pixelcraft.studio">
                    <Button size="lg" className="gap-2" data-testid="button-contact-email">
                      Start a Project
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>or call</span>
                    <a href="tel:+15551234567" className="font-semibold text-foreground hover:text-primary transition-colors">
                      (555) 123-4567
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
