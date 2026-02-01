export const hashSecret = async (value: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const verifySecret = async (secret: string, expectedHash: string) => {
  const hash = await hashSecret(secret);
  return hash === expectedHash;
};
