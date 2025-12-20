import { Link } from "wouter";
import { ArrowRight, Code, Palette, Zap, Globe, CheckCircle, ChevronDown, Sparkles, Users, Clock, Award, Star, MousePointer, Layers, Rocket, Layout, Calendar, ShoppingCart, Check, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
    businessName: "Worship Wave",
    industry: "Church Organization",
    image: "https://assets.worshipartistry.com/sites/default/files/imagecache/share/greenroom-main/youthgroup_0.jpg",
    result: "Complete worship management",
  },
  {
    id: "2",
    businessName: "Verse Vault",
    industry: "Bible App",
    image: "https://cf.albertmohler.com/uploads/2016/09/iStock_45271310_MED.jpg",
    result: "AI-powered Bible study",
  },
  {
    id: "3",
    businessName: "ML Web Design",
    industry: "Web Design Platform",
    image: "https://www.in2code.de/fileadmin/_processed_/0/b/csm_code_javascript_49d002a67e.webp",
    result: "Client management system",
  },
];

const stats = [
  { value: 3, label: "Projects Completed", suffix: "" },
  { value: 2, label: "Happy Clients", suffix: "" },
  { value: 100, label: "Client Satisfaction", suffix: "%" },
  { value: 5.0, label: "Average Rating", icon: Star, decimals: 1 },
];

const pricingTiers = [
  {
    id: 'standard',
    name: 'Standard Website',
    icon: Layout,
    description: 'Perfect for small businesses and personal sites',
    price: 'Contact for Quote',
    features: [
      'Free consultation',
      '5-8 pages included',
      'Modern, responsive design',
      'Visual features & animations',
      'Free SSL certificate',
      'Optimized performance',
      'Security & DDoS protection'
    ]
  },
  {
    id: 'premium',
    name: 'Business / Premium',
    icon: Calendar,
    description: 'Advanced features for growing businesses',
    price: 'Contact for Quote',
    popular: true,
    features: [
      'Everything in Standard',
      'Up to 8 pages (custom beyond)',
      'Scheduling & booking tools',
      'Client intake forms',
      'Membership logins',
      'Calendar sync',
      'Advanced SEO optimization',
      'Performance tuning'
    ]
  },
  {
    id: 'store',
    name: 'Premium Web Store',
    icon: ShoppingCart,
    description: 'Complete e-commerce solution',
    price: 'Contact for Quote',
    features: [
      'Everything in Premium',
      'Full Shopify integration',
      'Product variants & filters',
      'Multiple payment gateways',
      'Shipping & tax automation',
      'Digital & physical products',
      'Scalable catalog support',
      'E-commerce optimization'
    ]
  }
];

const clientJourney = [
  {
    step: "01",
    title: "Client Onboarding",
    description: "After our initial conversation, we create your account and send you access to your private client portal.",
  },
  {
    step: "02",
    title: "Questionnaire",
    description: "Complete our detailed questionnaire about your business, goals, branding, and website requirements.",
  },
  {
    step: "03",
    title: "Terms & Agreement",
    description: "Review and digitally sign our terms of service agreement outlining project scope and deliverables.",
  },
  {
    step: "04",
    title: "Development Phase",
    description: "We build your website while keeping you updated through your portal with progress updates.",
  },
  {
    step: "05",
    title: "Review & Revisions",
    description: "Preview your site, request changes, and collaborate with us until you're completely satisfied.",
  },
  {
    step: "06",
    title: "Launch & Handoff",
    description: "We set up hosting, deploy your site, and provide all credentials and documentation.",
  },
  {
    step: "07",
    title: "Ongoing Support",
    description: "Your portal remains active for support requests, updates, and future enhancements.",
  },
];

const testimonials: { quote: string; author: string; role: string; image: string }[] = [];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0 },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const staggerContainerFast = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

function AnimatedCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const startTime = Date.now();
    const startValue = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * easeOutProgress;
      
      setDisplayValue(decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString());
      
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [value, decimals]);

  return (
    <span>
      {displayValue}{suffix}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm" data-testid="badge-hero">
              <Sparkles className="w-4 h-4 mr-2" />
              Premium Web Design Made Easy
            </Badge>
          </motion.div>

          <motion.h1 
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]" 
            data-testid="text-hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Websites That
            <motion.span 
              className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Drive Results
            </motion.span>
          </motion.h1>

          <motion.p 
            className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed" 
            data-testid="text-hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            We craft stunning, high-performance websites that elevate your brand 
            and turn visitors into loyal customers.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link href="/portfolio">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="gap-2" data-testid="button-view-work">
                  View Our Work
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/about">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" data-testid="button-learn-more">
                  About Us
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats Row - Coming Soon */}
          <motion.div 
            className="relative max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 blur-sm opacity-50">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" data-testid={`stat-${index}`}>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-1">
                    {stat.value}{stat.suffix}
                    {stat.icon && <stat.icon className="w-5 h-5 text-primary fill-primary" />}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge variant="secondary" className="px-6 py-3 text-base font-medium shadow-lg">
                <Clock className="w-4 h-4 mr-2" />
                Stats Coming Soon
              </Badge>
            </div>
          </motion.div>
        </div>

        <motion.a
          href="#services"
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          data-testid="link-scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </motion.a>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">Our Services</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-services-title">
              Everything You Need to
              <span className="block text-primary">Succeed Online</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From concept to launch, we provide comprehensive web design services 
              tailored to your unique business needs.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="group border-border/50 hover-elevate overflow-hidden h-full" data-testid={`card-service-${index}`}>
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <motion.div 
                        className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                      >
                        <service.icon className="w-8 h-8 text-primary" />
                      </motion.div>
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">Our Process</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-process-title">
              From Idea to
              <span className="block text-primary">Reality</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A proven approach that delivers exceptional results, every time.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {process.map((item, index) => (
              <motion.div 
                key={index} 
                className="relative" 
                data-testid={`process-step-${index}`}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="text-7xl font-serif font-bold text-primary/10 absolute -top-4 -left-2"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {item.step}
                </motion.div>
                <div className="relative pt-12">
                  <h3 className="font-serif font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <motion.div 
                    className="hidden lg:block absolute top-16 right-0 w-12 border-t-2 border-dashed border-border translate-x-6"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">Our Work</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-portfolio-title">
              Featured
              <span className="block text-primary">Projects</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real results for real businesses. See how we've helped our clients succeed.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {portfolioPreview.map((item) => (
              <motion.div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-border/50"
                data-testid={`card-portfolio-${item.id}`}
                variants={scaleIn}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8 }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <motion.img
                    src={item.image}
                    alt={item.businessName}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Badge variant="secondary" className="mb-2">
                    {item.industry}
                  </Badge>
                  <h3 className="font-serif font-bold text-xl text-foreground mb-1">
                    {item.businessName}
                  </h3>
                  <p className="text-sm text-primary font-medium">{item.result}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/portfolio">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-view-portfolio">
                  View Full Portfolio
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Coming Soon */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-testimonials-title">
              What Our Clients
              <span className="block text-primary">Say About Us</span>
            </h2>
            
            <motion.div 
              className="relative max-w-4xl mx-auto mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 blur-sm opacity-40">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-8">
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-5 h-5 text-primary fill-primary" />
                        ))}
                      </div>
                      <div className="h-20 bg-muted rounded mb-6" />
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted" />
                        <div>
                          <div className="h-4 w-24 bg-muted rounded mb-2" />
                          <div className="h-3 w-16 bg-muted rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Badge variant="secondary" className="px-6 py-3 text-base font-medium shadow-lg">
                  <Clock className="w-4 h-4 mr-2" />
                  Testimonials Coming Soon
                </Badge>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInLeft}
              transition={{ duration: 0.7 }}
            >
              <Badge variant="outline" className="mb-4">Why Choose Us</Badge>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-8" data-testid="text-why-us-title">
                Your Partner in
                <span className="block text-primary">Digital Success</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                We're not just designers - we're strategic partners committed to your growth.
              </p>

              <motion.ul 
                className="space-y-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  { icon: Palette, text: "Custom designs tailored to your brand identity" },
                  { icon: Zap, text: "Lightning-fast, mobile-responsive websites" },
                  { icon: Award, text: "SEO-optimized for better search rankings" },
                  { icon: Users, text: "Dedicated support and ongoing maintenance" },
                  { icon: Clock, text: "Clear communication and on-time delivery" },
                ].map((item, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-center gap-4"
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <span className="text-lg">{item.text}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div 
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInRight}
              transition={{ duration: 0.7 }}
            >
              <motion.div 
                className="aspect-[4/5] rounded-3xl overflow-hidden border border-border/50"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop"
                  alt="Our team at work"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -40, y: 40 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="absolute -bottom-8 -left-8 shadow-xl border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Rocket className="w-7 h-7 text-primary" />
                      </motion.div>
                      <div>
                        <div className="font-serif text-3xl font-bold">
                          <AnimatedCounter value={3} suffix="" />
                        </div>
                        <div className="text-muted-foreground">Projects Launched</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Client Journey Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-journey-title">
              Your Journey
              <span className="block text-primary">From Start to Finish</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A transparent, premium experience from the moment you become our client until project completion and beyond.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clientJourney.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 hover-elevate" data-testid={`journey-step-${index}`}>
                  <CardContent className="p-6">
                    <div className="font-serif text-4xl font-bold text-primary/20 mb-3">{item.step}</div>
                    <h3 className="font-serif font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Contact Section */}
      <ContactSection />

      <PublicFooter />
    </div>
  );
}

function PricingSection() {
  const [activeTab, setActiveTab] = useState('premium');
  const activeTier = pricingTiers.find(tier => tier.id === activeTab);
  const Icon = activeTier?.icon;

  return (
    <section id="pricing" className="py-32 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-pricing-title">
            Choose Your
            <span className="block text-primary">Perfect Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All plans include free consultation and ongoing support. Custom quotes available for unique requirements.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-2 mb-8 p-1 bg-muted rounded-lg border border-border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {pricingTiers.map((tier) => {
            const TierIcon = tier.icon;
            return (
              <button
                key={tier.id}
                onClick={() => setActiveTab(tier.id)}
                className={`flex-1 relative px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tier.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`button-pricing-${tier.id}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TierIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tier.name}</span>
                  <span className="sm:hidden">{tier.name.split(' ')[0]}</span>
                </div>
                {tier.popular && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative bg-primary/10 p-4 rounded-full inline-block">
                  {Icon && <Icon className="h-8 w-8 text-primary" />}
                </div>
              </div>
              <CardTitle className="text-3xl font-serif">{activeTier?.name}</CardTitle>
              <p className="text-muted-foreground mt-2">{activeTier?.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">{activeTier?.price}</span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {activeTier?.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 bg-primary/10 rounded-full p-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                <a href="#contact" className="flex-1">
                  <Button className="w-full" size="lg" data-testid="button-pricing-get-started">
                    Get Started
                  </Button>
                </a>
                <a href="#contact" className="flex-1">
                  <Button variant="outline" className="w-full" size="lg" data-testid="button-pricing-learn-more">
                    Learn More
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Message Sent",
      description: "Thank you for reaching out. We'll get back to you within 24 hours.",
    });

    setFormData({ name: '', email: '', company: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <section id="contact" className="py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4">Get In Touch</Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-contact-title">
            Ready to Start
            <span className="block text-primary">Your Project?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Send us a message and we'll get back to you within 24 hours with a free consultation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-8 sm:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Your Name
                    </label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium">
                    Company / Business Name
                  </label>
                  <Input
                    id="company"
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    data-testid="input-contact-company"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Tell us about your project
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Describe what you're looking for, your timeline, budget range, and any specific requirements..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    data-testid="input-contact-message"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Or email us directly at{' '}
                    <a href="mailto:hello@mlwebdesign.com" className="text-primary hover:underline">
                      hello@mlwebdesign.com
                    </a>
                  </p>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="gap-2 w-full sm:w-auto"
                    disabled={isSubmitting}
                    data-testid="button-contact-submit"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
