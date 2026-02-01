const textEncoder = new TextEncoder();
const PBKDF2_ITERATIONS = 150_000;
const PBKDF2_HASH = "SHA-256";
const SALT_BYTES = 16;

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
};

const deriveHash = async (value: string, salt: Uint8Array, iterations: number) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(value),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    256,
  );
  return toHex(derivedBits);
};

export const hashSecret = async (value: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveHash(value, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
};

export const verifySecret = async (secret: string, expectedHash: string) => {
  const [scheme, iterationsRaw, saltHex, storedHash] = expectedHash.split("$");
  if (scheme !== "pbkdf2" || !iterationsRaw || !saltHex || !storedHash) {
    return false;
  }
  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }
  const salt = fromHex(saltHex);
  const computedHash = await deriveHash(secret, salt, iterations);
  return timingSafeEqual(computedHash, storedHash);
};
