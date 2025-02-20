import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cors from "cors";
import express from "express"
import bcrypt from "bcryptjs"

const app = express();
app.use(express.json())
app.use(
  cors({
    origin : "*",
  })
);
mongoose.connect("mongodb://localhost:27017/Voting")

const SECRET_KEY = "sigma"
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  city: String,
  hasVoted: { type: Boolean, default: false },
  role: { type: String, enum: ["admin", "user" , "registered"], default: "user" },
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// Schema City & Province
const provinceSchema = new mongoose.Schema({ name: String });
const citySchema = new mongoose.Schema({
  name: String,
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' }
});
const Province = mongoose.model('Province', provinceSchema);
const City = mongoose.model('City', citySchema);

// Schema Kandidat Presiden & Wapres
const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: { type: String, required: true },
  type: { type: String, enum: ["presiden", "wapres", "dpr", "dpd"], required: true },
  city: { type: String, default: null }, // Untuk DPD dan DPR
  voteCount: { type: Number, default: 0 }
});

// Schema Partai
const partySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }] // Simpan referensi kandidat, bukan objek langsung
});

const Candidate = mongoose.model("Candidate", candidateSchema);
const Party = mongoose.model("Party", partySchema);
// Schema Vote
const voteSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  presidenId: mongoose.Schema.Types.ObjectId,
  dpdId: mongoose.Schema.Types.ObjectId,
  dprId: mongoose.Schema.Types.ObjectId,
});
const Vote = mongoose.model('Vote', voteSchema);


app.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, email, password: hashedPassword, role: "admin" });
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Login
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    
    const token = jwt.sign({ id: admin._id, role: admin.role }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Middleware for Admin Authentication
const adminAuth = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    console.log("⚠️ Token tidak ditemukan di request headers");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const extractedToken = token.replace("Bearer ", "").trim();
    console.log("🔍 Token yang diterima backend:", extractedToken);

    const decoded = jwt.verify(extractedToken, SECRET_KEY);
    req.user = decoded;
    console.log("✅ User dari token:", req.user);
    next();
  } catch (error) {
    console.error("❌ Error verifikasi token:", error);
    res.status(403).json({ message: "Invalid token" });
  }
};

app.post("/admin/candidates", adminAuth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Only admin can add candidates" });
  }

  try {
    const { name, photo, type, party } = req.body;
    if (!name || !photo || !type) {
      return res.status(400).json({ message: "Nama, foto, dan tipe kandidat harus diisi" });
    }

    const newCandidate = await Candidate.create({ name, photo, type, party });
    res.status(201).json({ message: "Kandidat berhasil ditambahkan!", candidate: newCandidate });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.post("/admin/candidates", adminAuth, async (req, res) => {
  try {
    const { name, photo, type, party, city } = req.body;

    if (type === "dpr") {
      const existingParty = await Party.findOne({ name: party });
      if (!existingParty) return res.status(400).json({ error: "Partai tidak ditemukan" });

      const newCandidate = { name, photo, type, city };
      existingParty.candidates.push(newCandidate);
      await existingParty.save();
      return res.status(201).json({ message: "Kandidat berhasil ditambahkan ke partai", party: existingParty });
    }

    const candidate = await Candidate.create({ name, photo, type, city });
    res.status(201).json(candidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/admin/candidates", adminAuth, async (req, res) => {
  const candidates = await Candidate.find();
  res.json(candidates);
});

app.put("/admin/candidates/:id",adminAuth, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!candidate) return res.status(404).send("Candidate not found");
    res.json(candidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/admin/candidates/:id",adminAuth, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).send("Candidate not found");
    res.send("Candidate deleted");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { email, password, age } = req.body;
    
    // Cek apakah email sudah digunakan
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, age, role: 'registered' });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: `Registration failed ${error}` });
  }
})
// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, 'secret', { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
});

// Middleware Auth
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader); // Debugging

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  
  const token = authHeader.split(" ")[1];

  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
      console.log("JWT Error:", err.message); // Debugging
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = decoded;
    console.log("Decoded Token:", decoded); // Debugging
    next();
  });
};

const createAdmin = async () => {
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({ email: 'admin@example.com', password: hashedPassword, role: 'admin' });
    await admin.save();
    console.log('Admin account created');
  }
};

// CRUD Candidates
app.get("/admin/parties", adminAuth, async (req, res) => {
  try {
    const parties = await Party.find().populate("candidates");
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/admin/parties/:partyId/candidates", adminAuth, async (req, res) => {
  try {
    const { partyId } = req.params;
    const { name, photo, type, city } = req.body;

    const party = await Party.findById(partyId);
    if (!party) return res.status(404).json({ error: "Partai tidak ditemukan" });

    // Buat kandidat di koleksi Candidate
    const newCandidate = await Candidate.create({ name, photo, type, city });

    // Simpan ID kandidat di dalam partai
    party.candidates.push(newCandidate._id);
    await party.save();

    // Tampilkan detail partai dengan kandidatnya
    const updatedParty = await Party.findById(partyId).populate("candidates");

    res.status(201).json({ message: "Kandidat berhasil ditambahkan ke partai", party: updatedParty });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/admin/parties", adminAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nama partai harus diisi" });

    const existingParty = await Party.findOne({ name });
    if (existingParty) return res.status(400).json({ error: "Partai sudah ada" });

    const newParty = await Party.create({ name });
    res.status(201).json({ message: "Partai berhasil ditambahkan!", party: newParty });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/candidates', adminAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  const candidate = new Candidate(req.body);
  await candidate.save();
  res.json({ message: 'Candidate added' });
});

app.get("/candidates", async (req, res) => {
  const candidates = await Candidate.find().select("name photo type party city voteCount");
  res.json(candidates);
});

app.put('/candidates/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  await Candidate.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: 'Candidate updated' });
});

app.delete('/candidates/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  await Candidate.findByIdAndDelete(req.params.id);
  res.json({ message: 'Candidate deleted' });
});

// 

app.post("/vote", auth, async (req, res) => {
  const { candidateId } = req.body;
  let candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  candidate = await Candidate.findByIdAndUpdate(
    candidateId,
    { $inc: { voteCount: 1 } },
    { new: true, returnDocument: "after" }
  );

  res.json({ message: "Vote recorded", voteCount: candidate.voteCount });
});

// Get Results
app.get("/results", async (req, res) => {
  const results = await Candidate.find().select("name type voteCount");
  res.json(results);
});

createAdmin(); // Run this once to ensure admin exists

app.listen(5000, () => console.log('Server running on port 5000'));