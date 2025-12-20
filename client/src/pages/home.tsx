import { Link } from "wouter";
import { ArrowRight, Code, Palette, Zap, Globe, CheckCircle, ChevronDown, Sparkles, Users, Clock, Award, Star, MousePointer, Layers, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
  { value: 50, label: "Happy Clients", suffix: "+" },
  { value: 120, label: "Projects Delivered", suffix: "+" },
  { value: 98, label: "Client Retention", suffix: "%" },
  { value: 5.0, label: "Average Rating", icon: Star, decimals: 1 },
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

          {/* Stats Row */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center" 
                data-testid={`stat-${index}`}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div className="font-serif text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} decimals={stat.decimals || 0} />
                  {stat.icon && <stat.icon className="w-5 h-5 text-primary fill-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
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

      {/* Testimonials Section */}
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
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-testimonials-title">
              What Our Clients
              <span className="block text-primary">Say About Us</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="border-border/50 h-full" data-testid={`testimonial-${index}`}>
                  <CardContent className="p-8">
                    <motion.div 
                      className="flex gap-1 mb-6"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={staggerContainerFast}
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          variants={scaleIn}
                          transition={{ duration: 0.3 }}
                        >
                          <Star className="w-5 h-5 text-primary fill-primary" />
                        </motion.div>
                      ))}
                    </motion.div>
                    <blockquote className="text-lg mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <motion.img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      />
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
                          <AnimatedCounter value={120} suffix="+" />
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

      {/* Contact CTA */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5">
              <CardContent className="p-12 sm:p-16 lg:p-20">
                <motion.div 
                  className="text-center"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={fadeInUp}>
                    <Badge variant="secondary" className="mb-6">Get Started</Badge>
                  </motion.div>
                  <motion.h2 
                    className="font-serif text-4xl sm:text-5xl font-bold mb-6" 
                    data-testid="text-cta-title"
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                  >
                    Ready to Transform
                    <span className="block text-primary">Your Online Presence?</span>
                  </motion.h2>
                  <motion.p 
                    className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                  >
                    We work with select clients to deliver exceptional results. 
                    Let's discuss how we can help your business grow.
                  </motion.p>

                  <motion.div 
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                  >
                    <a href="mailto:hello@pixelcraft.studio">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                        <Button size="lg" className="gap-2" data-testid="button-contact-email">
                          Start a Project
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    </a>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>or call</span>
                      <a href="tel:+15551234567" className="font-semibold text-foreground hover:text-primary transition-colors">
                        (555) 123-4567
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
