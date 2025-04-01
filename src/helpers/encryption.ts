import crypto from "crypto";

export async function deriveKey(
  email: string,
  user_id: string,
  password: string,
  iterations = 10000,
  keyLength = 32,
  digest = "sha256"
) {
  return new Promise<{ key: string }>((resolve, reject) => {
    const salt =
      process.env.SALT ||
      "93a52b8f2a75109c5affb35ed5b1aeaa77b412fd3fd29370b43707018c0e8ab4";
    if (!salt) {
      throw new Error("Salt is required but received undefined");
    }
    const input = `${email}:${user_id}:${password}`;

    crypto.pbkdf2(
      Buffer.from(input, "utf-8"),
      Buffer.from(salt, "hex"),
      iterations,
      keyLength,
      digest,
      (err: Error | null, derivedKey: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            key: derivedKey.toString("base64"),
          });
        }
      }
    );
  });
}
