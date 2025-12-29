import { Users, Award, Clock, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { motion } from "framer-motion";

const stats = [
  { icon: Users, label: "Happy Clients", value: "2+" },
  { icon: Award, label: "Projects Completed", value: "3" },
  { icon: Clock, label: "Years Experience", value: "1+" },
  { icon: Heart, label: "Client Satisfaction", value: "100%" },
];

const team = [
  {
    name: "Luke Vetsch",
    role: "Web Designer, Lead Developer",
    bio: "As a self-taught developer fluent in 5+ programming languages, I believe this generation has an incredible opportunity to shape the digital landscape. I build complete web solutions, from custom sites to e-commerce platforms, with integrity at the core of everything I do. My faith drives me to deliver excellent work, treat clients with respect, and create digital experiences that truly serve people.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  },
  {
    name: "Makaio Roos",
    role: "Web Designer, Head of Finance",
    bio: "Jordan transforms designs into pixel-perfect, high-performance websites using the latest web technologies.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  },
];

const process = [
  {
    step: "01",
    title: "Discovery",
    description: "We start by understanding your business, goals, and target audience through in-depth conversations.",
  },
  {
    step: "02",
    title: "Strategy",
    description: "We develop a tailored strategy that aligns your website with your business objectives.",
  },
  {
    step: "03",
    title: "Design",
    description: "Our designers create stunning mockups that bring your vision to life.",
  },
  {
    step: "04",
    title: "Development",
    description: "We build your website using modern technologies for optimal performance.",
  },
  {
    step: "05",
    title: "Launch",
    description: "After thorough testing, we launch your website and provide ongoing support.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-6" 
            data-testid="text-about-hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            About Us
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We're a passionate team of designers and developers dedicated to creating 
            exceptional web experiences for businesses.
          </motion.p>
        </div>
      </section>

      {/* Stats - Coming Soon */}
      <section className="py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 blur-sm opacity-50">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" data-testid={`stat-${index}`}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="font-serif text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full border border-border shadow-lg">
                <div className="flex items-center gap-2 text-base font-medium">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Stats Coming Soon</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInLeft}
              transition={{ duration: 0.7 }}
            >
              <motion.div 
                className="aspect-[4/3] rounded-2xl overflow-hidden border border-border/50"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop"
                  alt="Our workspace"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInRight}
              transition={{ duration: 0.7 }}
            >
              <motion.h2 
                className="font-serif text-3xl sm:text-4xl font-bold mb-6" 
                data-testid="text-story-title"
                variants={fadeInUp}
              >
                Our Story
              </motion.h2>
              <motion.div 
                className="space-y-4 text-muted-foreground"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.p variants={fadeInUp} transition={{ duration: 0.5 }}>
                  ML WebDesign was founded with a simple mission: to help businesses 
                  thrive online through beautiful, functional websites.
                </motion.p>
                <motion.p variants={fadeInUp} transition={{ duration: 0.5 }}>
                  What started as a two-person operation has grown into a trusted 
                  web design studio serving clients across various industries. We've 
                  maintained our commitment to quality and personal attention that 
                  made us successful from day one.
                </motion.p>
                <motion.p variants={fadeInUp} transition={{ duration: 0.5 }}>
                  We believe in building long-term relationships with our clients. 
                  When you work with us, you're not just getting a website — you're 
                  gaining a partner invested in your success.
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-team-title">
              Meet the Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The talented people behind your next great website.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {team.map((member, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="border-border/50 h-full" data-testid={`card-team-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <motion.div 
                        className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-primary/20"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                      <div>
                        <h3 className="font-serif font-semibold text-lg">{member.name}</h3>
                        <p className="text-primary text-sm mb-2">{member.role}</p>
                        <p className="text-muted-foreground text-sm">{member.bio}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-process-title">
              Our Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A proven approach to delivering exceptional results.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {process.map((step, index) => (
              <motion.div 
                key={index} 
                className="text-center" 
                data-testid={`process-step-${index}`}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="font-serif text-5xl font-bold text-primary/20 mb-4"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {step.step}
                </motion.div>
                <h3 className="font-serif font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
