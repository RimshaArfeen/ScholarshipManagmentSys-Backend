// index.js
import express from "express";
import mongoose from 'mongoose';
import cors from "cors";
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";

import User from "./Schema/Applicant.js";
import StudentInfo from "./Schema/StudentInfo.js";
import Admin from "./Schema/AdminSchema.js";

dotenv.config();

const jwtKey = "jwtSecrectKey";

// Setup __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.mongoDbURL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.get('/', (req, res) => {
  res.send('Backend is live via serverless function!');
})


app.post('/signup', async (req, res) => {
  try {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;

    JWT.sign({ result }, jwtKey, { expiresIn: "50000s" }, (err, token) => {
      if (err) {
        return res.status(500).json({ message: "Something went wrong with token generation" });
      }
      res.json({
        message: 'User signed up successfully',
        result,
        auth: token
      });
    });

  } catch (error) {
    return res.status(500).json({ message: "Encountering error", error: error.message });
  }
});

app.post("/login", async (req, res) => {
 const { email, password , role} = req.body;

if (email && password) {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    password: password.trim(),
    role :role.toLowerCase()
  }).select("-password");

  if (user) {
    JWT.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
      if (err) {
        res.send("Something went wrong");
      } else {
        res.json({ user, auth: token });
      }
    });
  } else {
    res.status(401).json({ error: "Invalid Credentials" });
  }
} else {
  res.status(400).json({ error: "Please enter your email and password" });
}

});

app.post("/applicationForm", async (req, res) => {
  try {
    const student = new StudentInfo(req.body);
    const result = await student.save();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/profile", verifyToken, (req, res) => {
  JWT.verify(req.token, jwtKey, (err, authData) => {
    if (err) {
      res.status(403).json({ result: "Please provide a valid token" });
    } else {
      res.json({ authData });
    }
  });
});

app.get("/adminPg", async (req, res) => {
  try {
    let studentData = await StudentInfo.find();
    res.json({ studentData });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

app.put("/adminPg/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updApplication = await StudentInfo.findByIdAndUpdate(id, { status }, { new: true });
  res.json({ message: `Application ${status.toLowerCase()} successfully`, updApplication });
});

// Middleware to verify token
function verifyToken(req, res, next) {
  let bearerHeader = req.headers['authorization'];
  if (bearerHeader) {
    let token = bearerHeader.split(" ")[1];
    req.token = token;
    next();
  } else {
    res.status(403).json({ message: "Please provide a valid token" });
  }
}

// // 🟨 Serve Frontend (after all API routes)
// app.use(express.static(path.join(__dirname, "Frontend/dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "Frontend/dist", "index.html"));
// });

// Start the server
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
// });
