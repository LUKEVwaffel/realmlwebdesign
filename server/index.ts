import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { getStripeSync, getStripeSecretKey, getUncachableStripeClient, isStripeEnabled } from "./stripeClient";
import { handleStripeWebhook } from "./webhookHandlers";
import { seedDatabase } from "./seedDatabase";
import Stripe from "stripe";

const app = express();
const httpServer = createServer(app);

// Health check endpoint - must respond immediately for deployment
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

let stripeWebhookSecret: string | null = null;

async function initStripe() {
  if (!isStripeEnabled()) {
    log("Stripe disabled via STRIPE_ENABLED=false", "stripe");
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    await stripe.balance.retrieve();
    log("Stripe connection verified", "stripe");
  } catch (error) {
    log(`Stripe init error (continuing without Stripe): ${error}`, "stripe");
  }
}

app.post('/api/stripe/webhook/:uuid', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isStripeEnabled()) {
    return res.status(503).send('Stripe is temporarily disabled');
  }
  
  const sig = req.headers['stripe-signature'];
  
  if (!sig || !stripeWebhookSecret) {
    return res.status(400).send('Webhook signature required');
  }

  try {
    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      stripeWebhookSecret
    );
    
    await handleStripeWebhook(event, req, res);
  } catch (err: any) {
    log(`Webhook signature verification failed: ${err.message}`, 'stripe');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed database with default admin users if they don't exist
  await seedDatabase();
  
  // Initialize routes first for health checks
  await registerRoutes(httpServer, app);
  
  // Initialize Stripe in background (non-blocking)
  initStripe().catch(err => {
    console.error("Stripe background init failed:", err);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
