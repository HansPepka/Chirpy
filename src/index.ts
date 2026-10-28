import express, { NextFunction } from "express";
import {Request, Response} from "express";
import {config}  from "./config.js";
import { createUser, deleteAllUsers } from "./db/queries/users.js";

const app = express();
const PORT = 8080;

// # Creating handlers

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
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>
    `
  );
}

// Defining the handler that resets the fileserverHits counter to 0
const handlerResetMetrics = (req: Request, res: Response) => {
  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits counter reset to: ${config.api.fileserverHits}`);
}

// Create a list of words to be filtered out
const list = ["kerfuffle", "sharbert", "fornax"];


// --- 3 - Creating the handler that validates the chirp ----
async function handlerValidateChirp(req: Request, res: Response) {
  type responseData = {
    body: string;
  };

  // 3. Turn the JSON text into a JavaScript object (this is the easy way)
  const params: responseData = req.body;
 
  // 5. Apply the 140-character rule
  if (params.body.length > 140) {
     throw new BadRequestError("Chirp is too long. Max length is 140");
  }
  
  let list1 = params.body.split(" ");
    for (const word of list) {
     list1 = list1.map((w) => w.toLowerCase() === word ? "****" : w);
    }
  params.body = list1.join(" ");

  // 6. All good
  res.status(200).send({"cleanedBody": `${params.body}`});
}

// Error-handlina useg middleware: we defined how the server should throw errors based on the code.

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof NotFoundError){
    res.status(404).json({error: err.message})
  }
  else if(err instanceof BadRequestError){
    res.status(400).json({error: err.message})
  }
  else if(err instanceof UnauthorizedError){
    res.status(401).json({error: err.message})
  }
  else if(err instanceof ForbiddenError){
    res.status(403).json({error: err.message})
  }
};

// Handler for creating a new user :

async function userCreateHandler (req: Request, res:Response) {
  const {email} = req.body;

  if(!email){
    res.status(400).json({error: "Email is required"});
    return;
  }
  const user = await createUser(email);

  res.status(201).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

}

// Creating a handler to reset all the users of the db :

async function handlerReset(req: Request, res: Response){
  if (config.api.platform !== "dev"){
    return res.status(403).json({error: "Forbidden"});
  }

  config.api.fileserverHits = 0;

  await deleteAllUsers();

  res.status(200).send("Reset complete");
}

// # Callling handlers, middlewares and defining endpoints

// Calling the readiness handler when the /healthz endpoint is accessed
app.get("/api/healthz", handlerReadiness);

// Calling the metrics handler when the /metrics endpoint is accessedForbiddenError
app.get("/admin/metrics", handlerMetrics);

// Calling the reset-metrics handler when the /reset endpoint is accessed
app.post("/admin/reset", handlerResetMetrics);

// Middleware to log non-OK responses
app.use(middlewareLogResponses);

// Middleware to parse JSON bodies automatically, so we don't have to manually collect chunks of data
app.use(express.json());

// Middleware to increment the fileserverHits counter
app.use(middlewareMetricsInc);

app.use("/app", express.static("./src/app"));

app.post("/api/validate_chirp", handlerValidateChirp);

app.use(errorHandler);

app.post("/api/users", userCreateHandler);

app.post("/admin/reset", handlerReset);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// # Creating middlewares

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
  config.api.fileserverHits++;
  next();
}

// # Creating errors classes

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }    
}

class BadRequestError extends Error{
  constructor(message: string){
    super(message);
  }
}

class UnauthorizedError extends Error{
  constructor(message: string){
    super(message);
  }
}

class ForbiddenError extends Error{
  constructor(message: string){
    super(message);
  }
}

