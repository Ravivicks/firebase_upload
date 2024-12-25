import express from "express";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import cors from "cors";
// import path from "path";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const storage = new Storage();
const bucket = storage.bucket("YOUR_BUCKET_NAME");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const blob = bucket.file(`${req.body.userId}/${req.file.originalname}`);
  const blobStream = blob.createWriteStream();

  blobStream.on("error", (err) => {
    console.error(err);
    res.status(500).send("Error uploading file");
  });

  blobStream.on("finish", () => {
    res.status(200).send("File uploaded successfully");
  });

  blobStream.end(req.file.buffer);
});

app.get("/images/:userId", async (req, res) => {
  const [files] = await bucket.getFiles({ prefix: `${req.params.userId}/` });

  const filePromises = files.map(async (file) => {
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // 1 hour
    });
    return { name: file.name, url };
  });

  const fileUrls = await Promise.all(filePromises);
  res.json(fileUrls);
});

app.delete("/image/:userId/:imageName", async (req, res) => {
  const file = bucket.file(`${req.params.userId}/${req.params.imageName}`);

  try {
    await file.delete();
    res.status(200).send("File deleted successfully");
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).send("Error deleting file");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
