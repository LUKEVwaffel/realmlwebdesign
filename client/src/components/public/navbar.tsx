import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-provider";
import duoLogoLight from "@assets/ChatGPT_Image_Dec_29,_2025,_07_49_10_AM_1767014379495.png";
import duoLogoDark from "@assets/ChatGPT_Image_Dec_29,_2025,_07_56_01_AM_1767014379497.png";

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/about", label: "About" },
  ];

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileTap={{ scale: 0.98 }}
            >
              <img 
                src={isDark ? duoLogoDark : duoLogoLight} 
                alt="ML WebDesign"
                className="h-12 w-auto object-contain"
                data-testid="text-logo"
              />
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link href={link.href}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      className={location === link.href ? "bg-accent" : ""}
                      data-testid={`link-nav-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="hidden md:flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ThemeToggle />
            <Link href="/portal/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" data-testid="button-client-login">
                  Client Login
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                data-testid="button-mobile-menu"
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden py-4 border-t border-border/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="flex flex-col gap-2"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {navLinks.map((link) => (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <Link href={link.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${location === link.href ? "bg-accent" : ""}`}
                        onClick={() => setIsOpen(false)}
                        data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  <Link href="/portal/login">
                    <Button className="w-full" onClick={() => setIsOpen(false)} data-testid="button-mobile-login">
                      Client Login
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
