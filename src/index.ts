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

app.post("/api/validate_chirp", handlerValidateChirp);

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

export async function handlerValidateChirp(req: Request, res: Response) {
  type responseData = {
    body: string;
  };
  let rawBody = "";

  // 1. The request body arrives in pieces ("chunks") — collect them
  req.on("data", (chunk) => {
    rawBody += chunk;
  });

  // 2. When everything has arrived, process it
  req.on("end", () => {
    res.header("Content-Type", "application/json");

    // 3. Turn the JSON text into a JavaScript object (this is the risky part)
    let params: responseData;
    try {
      params = JSON.parse(rawBody);
    } catch (error) {
      res.status(400).send(JSON.stringify({ error: "Something went wrong" }));
      return;
    }

    // 4. Make sure "body" actually exists and is text
    if (typeof params.body !== "string") {
      res.status(400).send(JSON.stringify({ error: "Something went wrong" }));
      return;
    }

    // 5. Apply the 140-character rule
    if (params.body.length > 140) {
      res.status(400).send(JSON.stringify({ error: "Chirp is too long" }));
      return;
    }

    // 6. All good
    res.status(200).send(JSON.stringify({ valid: true }));
  });
}