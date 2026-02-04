// =============================================
// Cloudflare R2 Configuration (AWS SDK v3)
// =============================================

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

// Helper function to generate unique file names
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop();
  return `${timestamp}-${random}.${ext}`;
};

// Upload file to R2
const uploadToR2 = async (fileBuffer, originalFileName, folder = "uploads") => {
  try {
    const fileName = generateFileName(originalFileName);
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: "audio/mpeg", // Adjust based on file type
    });

    await s3Client.send(command);

    return {
      fileName: fileName,
      key: key,
      url: `${PUBLIC_URL}/${key}`,
      size: fileBuffer.length,
    };
  } catch (error) {
    console.error("❌ R2 Upload Error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// Delete file from R2
const deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("❌ R2 Delete Error:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Get file from R2
const getFromR2 = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("❌ R2 Get Error:", error);
    throw new Error(`Failed to get file: ${error.message}`);
  }
};

module.exports = {
  uploadToR2,
  deleteFromR2,
  getFromR2,
  BUCKET_NAME,
  PUBLIC_URL,
  generateFileName,
};
