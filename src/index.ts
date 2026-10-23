import express, { NextFunction } from "express";
import {Request, Response} from "express";
import {config}  from "./config.js";

const app = express();
const PORT = 8080;

//--- 1 - Adding the readiness endpoint ----

// Defining the readiness handler
const handlerReadiness = (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};


// Defining the handler that writes the number of requests that have been counted
const handlerMetrics  = (req: Request, res: Response) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(
    `
    <html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>
    `
  );
}

// Defining the handler that resets the fileserverHits counter to 0
const handlerResetMetrics = (req: Request, res: Response) => {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits counter reset to: ${config.fileserverHits}`);
}

// Calling the readiness handler when the /healthz endpoint is accessed
app.get("/api/healthz", handlerReadiness);

// Calling the metrics handler when the /metrics endpoint is accessed
app.get("/admin/metrics", handlerMetrics);

// Calling the reset-metrics handler when the /reset endpoint is accessed
app.post("/admin/reset", handlerResetMetrics);

// Middleware to log non-OK responses
app.use(middlewareLogResponses);

// Middleware to increment the fileserverHits counter
app.use(middlewareMetricsInc);

app.use("/app", express.static("./src/app"));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});


// --- 2 - Creating the middleware which  logs non-OK responses----
function middlewareLogResponses(req: Request, res: Response, next: () => void) {
  // Store the original send function
  const originalSend = res.send;

  res.on("finish", () => {
    if (res.statusCode !== 200) {
      console.log(`[NON-OK] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    }
});

  // Call the next middleware in the stack
  next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction){
  config.fileserverHits++;
  next();
}


