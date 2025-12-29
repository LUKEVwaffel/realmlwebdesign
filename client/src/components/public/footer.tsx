import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import duoLogo from "@assets/ChatGPT_Image_Dec_29,_2025,_11_57_01_AM_1767027492270.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
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

export function PublicFooter() {
  
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div 
            className="col-span-1 md:col-span-2"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4">
              <img 
                src={duoLogo} 
                alt="ML WebDesign"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-muted-foreground max-w-md mb-4">
              We create stunning, modern websites that help businesses grow online. 
              Our team at ML WebDesign combines beautiful design with powerful functionality.
            </p>
            <p className="text-sm text-muted-foreground">
              We work by invitation. Interested? Let's chat!
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <h4 className="font-serif font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home", testId: "link-footer-home" },
                { href: "/portfolio", label: "Portfolio", testId: "link-footer-portfolio" },
                { href: "/about", label: "About Us", testId: "link-footer-about" },
                { href: "/portal/login", label: "Client Portal", testId: "link-footer-login" },
              ].map((link, index) => (
                <motion.li 
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={link.href}>
                    <motion.span 
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-block"
                      data-testid={link.testId}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <h4 className="font-serif font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3">
              <motion.li 
                className="flex items-center gap-2 text-muted-foreground"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@mlwebdesign.com" className="hover:text-foreground transition-colors" data-testid="link-email">
                  hello@mlwebdesign.com
                </a>
              </motion.li>
              <motion.li 
                className="flex items-center gap-2 text-muted-foreground"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Phone className="w-4 h-4" />
                <a href="tel:+15551234567" className="hover:text-foreground transition-colors" data-testid="link-phone">
                  (555) 123-4567
                </a>
              </motion.li>
              <motion.li 
                className="flex items-start gap-2 text-muted-foreground"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>San Francisco, CA</span>
              </motion.li>
            </ul>
          </motion.div>
        </motion.div>

        <motion.div 
          className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p>&copy; {new Date().getFullYear()} ML WebDesign. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
}
