import { Users, Award, Clock, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

const stats = [
  { icon: Users, label: "Happy Clients", value: "50+" },
  { icon: Award, label: "Projects Completed", value: "75+" },
  { icon: Clock, label: "Years Experience", value: "8+" },
  { icon: Heart, label: "Client Satisfaction", value: "100%" },
];

const team = [
  {
    name: "Alex Rivera",
    role: "Creative Director",
    bio: "With over a decade of experience in digital design, Alex leads our creative vision and ensures every project exceeds expectations.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  },
  {
    name: "Jordan Chen",
    role: "Lead Developer",
    bio: "Jordan transforms designs into pixel-perfect, high-performance websites using the latest web technologies.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-6" data-testid="text-about-hero">
            About Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're a passionate team of designers and developers dedicated to creating 
            exceptional web experiences for businesses.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border/50">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop"
                  alt="Our workspace"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6" data-testid="text-story-title">
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  PixelCraft was founded with a simple mission: to help businesses 
                  thrive online through beautiful, functional websites.
                </p>
                <p>
                  What started as a two-person operation has grown into a trusted 
                  web design studio serving clients across various industries. We've 
                  maintained our commitment to quality and personal attention that 
                  made us successful from day one.
                </p>
                <p>
                  We believe in building long-term relationships with our clients. 
                  When you work with us, you're not just getting a website — you're 
                  gaining a partner invested in your success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-team-title">
              Meet the Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The talented people behind your next great website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-border/50" data-testid={`card-team-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-primary/20">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-serif font-semibold text-lg">{member.name}</h3>
                      <p className="text-primary text-sm mb-2">{member.role}</p>
                      <p className="text-muted-foreground text-sm">{member.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-process-title">
              Our Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A proven approach to delivering exceptional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center" data-testid={`process-step-${index}`}>
                <div className="font-serif text-5xl font-bold text-primary/20 mb-4">
                  {step.step}
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
