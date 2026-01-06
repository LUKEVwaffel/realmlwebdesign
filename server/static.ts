import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production, __dirname is 'dist/', so we need 'dist/public'
  // In development with tsx, __dirname is 'server/', so we need '../dist/public'
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = isProduction 
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");
    
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
