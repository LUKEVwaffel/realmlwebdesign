import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Use process.cwd() for reliable path resolution in both dev and production
  // In production, cwd is the project root, files are in dist/public
  const distPath = path.join(process.cwd(), "dist", "public");
  
  console.log(`[static] Looking for static files at: ${distPath}`);
  console.log(`[static] Current working directory: ${process.cwd()}`);
  console.log(`[static] Directory exists: ${fs.existsSync(distPath)}`);
    
  if (!fs.existsSync(distPath)) {
    // List what's in the current directory to help debug
    const cwdContents = fs.readdirSync(process.cwd());
    console.log(`[static] Contents of cwd: ${cwdContents.join(', ')}`);
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
