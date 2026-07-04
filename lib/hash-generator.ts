export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha384" | "sha512";

export const HASH_ALGORITHM_OPTIONS: Array<{ value: HashAlgorithm; label: string }> = [
  { value: "md5", label: "MD5" },
  { value: "sha1", label: "SHA-1" },
  { value: "sha256", label: "SHA-256" },
  { value: "sha384", label: "SHA-384" },
  { value: "sha512", label: "SHA-512" },
];

const textEncoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function utf8ToBinaryString(text: string): string {
  return Array.from(textEncoder.encode(text), (byte) => String.fromCharCode(byte)).join("");
}

function rotateLeft(value: number, shiftBits: number): number {
  return (value << shiftBits) | (value >>> (32 - shiftBits));
}

function addUnsigned(left: number, right: number): number {
  const left4 = left & 0x40000000;
  const right4 = right & 0x40000000;
  const left8 = left & 0x80000000;
  const right8 = right & 0x80000000;
  const result = (left & 0x3fffffff) + (right & 0x3fffffff);

  if (left4 & right4) {
    return result ^ 0x80000000 ^ left8 ^ right8;
  }

  if (left4 | right4) {
    if (result & 0x40000000) {
      return result ^ 0xc0000000 ^ left8 ^ right8;
    }
    return result ^ 0x40000000 ^ left8 ^ right8;
  }

  return result ^ left8 ^ right8;
}

function cmn(
  q: number,
  a: number,
  b: number,
  x: number,
  s: number,
  t: number
): number {
  return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, q), addUnsigned(x, t)), s), b);
}

function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}

function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}

function binaryStringToWordArray(binary: string): number[] {
  const messageLength = binary.length;
  const numberOfWordsTemp1 = messageLength + 8;
  const numberOfWordsTemp2 = (numberOfWordsTemp1 - (numberOfWordsTemp1 % 64)) / 64;
  const numberOfWords = (numberOfWordsTemp2 + 1) * 16;
  const wordArray = new Array<number>(numberOfWords).fill(0);

  let byteCount = 0;
  while (byteCount < messageLength) {
    const wordCount = (byteCount - (byteCount % 4)) / 4;
    const bytePosition = (byteCount % 4) * 8;
    wordArray[wordCount] |= binary.charCodeAt(byteCount) << bytePosition;
    byteCount += 1;
  }

  const wordCount = (byteCount - (byteCount % 4)) / 4;
  const bytePosition = (byteCount % 4) * 8;
  wordArray[wordCount] |= 0x80 << bytePosition;
  wordArray[numberOfWords - 2] = messageLength * 8;
  wordArray[numberOfWords - 1] = Math.floor(messageLength / 0x20000000);

  return wordArray;
}

function wordToHex(value: number): string {
  let output = "";
  for (let index = 0; index < 4; index += 1) {
    const byte = (value >>> (index * 8)) & 0xff;
    output += byte.toString(16).padStart(2, "0");
  }
  return output;
}

function md5Hex(text: string): string {
  const binary = utf8ToBinaryString(text);
  const x = binaryStringToWordArray(binary);

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = ff(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = gg(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], 23, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = ii(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, aa);
    b = addUnsigned(b, bb);
    c = addUnsigned(c, cc);
    d = addUnsigned(d, dd);
  }

  return `${wordToHex(a)}${wordToHex(b)}${wordToHex(c)}${wordToHex(d)}`;
}

const SHA_DIGEST_NAMES: Record<Exclude<HashAlgorithm, "md5">, string> = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

function shaDigest(algorithm: Exclude<HashAlgorithm, "md5">, text: string): Promise<string> {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    return Promise.reject(new Error("Web Crypto API is not available in this browser."));
  }

  return globalThis.crypto.subtle
    .digest(SHA_DIGEST_NAMES[algorithm], textEncoder.encode(text))
    .then((digest) => bytesToHex(new Uint8Array(digest)));
}

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  if (algorithm === "md5") {
    return md5Hex(text);
  }

  return shaDigest(algorithm, text);
}

export async function generateHashOutput(
  text: string,
  algorithm: HashAlgorithm,
  perLine: boolean
): Promise<string> {
  if (!perLine) {
    if (text === "") {
      return "";
    }

    return hashText(text, algorithm);
  }

  if (text === "") {
    return "";
  }

  const lines = text.split("\n");
  const hashes = await Promise.all(lines.map((line) => hashText(line, algorithm)));
  return hashes.join("\n");
}
