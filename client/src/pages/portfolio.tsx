import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { motion, AnimatePresence } from "framer-motion";
import type { PortfolioItem } from "@shared/schema";

const defaultPortfolio = [
  {
    id: "1",
    businessName: "Worship Wave",
    industry: "Church Organization",
    description: "An all in one worship management solution helping churches youth groups organize service plans, coordinate band members, schedule events, manage song libraries, and streamline communication across multiple users.",
    imageUrl: "https://assets.worshipartistry.com/sites/default/files/imagecache/share/greenroom-main/youthgroup_0.jpg",
    websiteUrl: "https://worship-wave-goingtosdhs.replit.app",
    features: ["Admin Prioritization", "Booking System", "Song Management", "Mobile Responsive"],
  },
  {
    id: "2",
    businessName: "Verse Vault",
    industry: "Bible App",
    description: "An AI Bible app powered by a custom hand-crafted AI model for deep scripture exploration and personalized study experiences.",
    imageUrl: "https://cf.albertmohler.com/uploads/2016/09/iStock_45271310_MED.jpg",
    websiteUrl: "https://verse-vault-goingtosdhs.replit.app",
    features: ["Storage Management", "Profile Creation", "AI Profiling", "Deep Analytics"],
  },
  {
    id: "3",
    businessName: "ML Web Design",
    industry: "Web Design Platform",
    description: "An amazing web management system with client and admin dashboard to create an easy and enjoyable experience for both parties.",
    imageUrl: "https://www.in2code.de/fileadmin/_processed_/0/b/csm_code_javascript_49d002a67e.webp",
    websiteUrl: "",
    features: ["Profile Management", "Project Showcase", "Contact Forms", "SEO Optimized"],
  },
];

const industries = ["All", "Church Organization", "Bible App", "Web Design Platform"];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
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

export default function PortfolioPage() {
  const [selectedIndustry, setSelectedIndustry] = useState("All");

  const { data: portfolioItems, isLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio"],
  });

  const displayItems = portfolioItems?.length ? portfolioItems : defaultPortfolio;
  
  const filteredItems = selectedIndustry === "All" 
    ? displayItems 
    : displayItems.filter(item => item.industry === selectedIndustry);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-6" 
            data-testid="text-portfolio-hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Our Portfolio
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Explore our collection of websites we've designed for businesses in our local community.
          </motion.p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {industries.map((industry, index) => (
              <motion.div
                key={industry}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Button
                  variant={selectedIndustry === industry ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedIndustry(industry)}
                  className="shrink-0"
                  data-testid={`button-filter-${industry.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {industry}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              key={selectedIndustry}
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.article
                    key={item.id}
                    className="group bg-card border border-border/50 rounded-xl overflow-hidden"
                    data-testid={`card-portfolio-item-${item.id}`}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    layout
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <motion.img
                        src={item.imageUrl}
                        alt={item.businessName}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="p-6">
                      <Badge variant="secondary" className="mb-3">
                        {item.industry}
                      </Badge>
                      <h3 className="font-serif font-semibold text-xl mb-2 flex items-center gap-2">
                        {item.businessName}
                        {item.websiteUrl && item.websiteUrl !== "#" && (
                          <motion.a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.2 }}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </motion.a>
                        )}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      {item.features && (
                        <motion.div 
                          className="flex flex-wrap gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {(item.features as string[]).slice(0, 3).map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {(item.features as string[]).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(item.features as string[]).length - 3} more
                            </Badge>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredItems.length === 0 && !isLoading && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-muted-foreground">No projects found in this category.</p>
            </motion.div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
