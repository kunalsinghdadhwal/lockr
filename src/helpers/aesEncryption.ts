import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const IV_LENGTH = 16;

export async function encryptAES256GCM(
  plainText: string,
  key: Buffer
): Promise<{ encryptedText: string }> {
  return new Promise((resolve, reject) => {
    try {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv("aes-256-gcm", key, iv);

      let encrypted = cipher.update(plainText, "utf8", "base64");
      encrypted += cipher.final("base64");

      const authTag = cipher.getAuthTag();

      resolve({
        encryptedText: `${iv.toString("base64")}:${encrypted}:${authTag.toString("base64")}`,
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function decryptAES256GCM(
  encryptedText: string,
  key: Buffer
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const [ivbase64, encryptedBase64, authTagBase64] =
        encryptedText.split(":");

      const iv = Buffer.from(ivbase64, "base64");
      const authTag = Buffer.from(authTagBase64, "base64");
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
      decrypted += decipher.final("utf8");

      resolve(decrypted);
    } catch (error) {
      reject(error);
    }
  });
}
