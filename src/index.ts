import express, { NextFunction } from "express";
import {Request, Response} from "express";
import "./config.js";

const app = express();
const PORT = 8080;

//--- 1 - Adding the readiness endpoint ----

// Defining the readiness handler
const handlerReadiness = (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};
// Calling the readiness handler when the /healthz endpoint is accessed
app.get("/healthz", handlerReadiness);
app.use(middlewareLogResponses);
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
  
}


