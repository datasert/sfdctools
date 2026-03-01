export interface JWTDecoded {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
  isValid: boolean;
  verificationError?: string;
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  try {
    // Decode base64
    const decoded = atob(base64);
    // Convert to UTF-8
    return decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (err) {
    throw new Error('Invalid base64url encoding');
  }
}

/**
 * Base64URL encode
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Verify JWT signature using HMAC-SHA256
 */
async function verifyHMAC256(
  header: string,
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Create the signing input
    const signingInput = `${header}.${payload}`;
    
    // Import the key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the input
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(signingInput)
    );
    
    // Convert signature to base64url
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    const signatureBase64Url = signatureBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Compare signatures (constant-time comparison)
    if (signature.length !== signatureBase64Url.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ signatureBase64Url.charCodeAt(i);
    }
    
    return result === 0;
  } catch (err) {
    return false;
  }
}

/**
 * Decode and verify JWT
 */
export async function decodeJWT(
  token: string,
  secret?: string
): Promise<JWTDecoded> {
  if (!token.trim()) {
    return {
      header: {},
      payload: {},
      signature: '',
      headerRaw: '',
      payloadRaw: '',
      isValid: false,
    };
  }

  try {
    // Split JWT into parts
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format. Expected 3 parts separated by dots.');
    }

    const [headerRaw, payloadRaw, signature] = parts;

    // Decode header and payload
    const headerJson = base64UrlDecode(headerRaw);
    const payloadJson = base64UrlDecode(payloadRaw);

    const header = JSON.parse(headerJson);
    const payload = JSON.parse(payloadJson);

    let isValid = false;
    let verificationError: string | undefined;

    // Verify signature if secret is provided
    if (secret && secret.trim()) {
      try {
        const alg = header.alg || 'HS256';
        
        if (alg === 'HS256') {
          isValid = await verifyHMAC256(headerRaw, payloadRaw, signature, secret.trim());
          if (!isValid) {
            verificationError = 'Signature verification failed';
          }
        } else {
          verificationError = `Algorithm ${alg} is not supported. Only HS256 is supported.`;
        }
      } catch (err) {
        verificationError = err instanceof Error ? err.message : 'Verification error';
      }
    }

    return {
      header,
      payload,
      signature,
      headerRaw,
      payloadRaw,
      isValid,
      verificationError,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      header: {},
      payload: {},
      signature: '',
      headerRaw: '',
      payloadRaw: '',
      isValid: false,
      verificationError: errorMessage,
    };
  }
}
