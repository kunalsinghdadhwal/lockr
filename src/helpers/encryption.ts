import crypto from "crypto";

export async function deriveKey(
  email: string,
  password: string,
  salt?: string,
  iterations = 10000,
  keyLength = 32,
  digest = "sha256"
) {
  return new Promise<{ key: string; salt: string }>((resolve, reject) => {
    const input = `${email}:${password}`;
    if (!salt) {
      salt = crypto.randomBytes(16).toString("base64");
    }

    crypto.pbkdf2(
      input,
      salt,
      iterations,
      keyLength,
      digest,
      (err: Error | null, derivedKey: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            key: derivedKey.toString("base64"),
            salt: salt || " ",
          });
        }
      }
    );
  });
}
