// Google OAuth and API utilities for Command Center

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Dynamically determine redirect URI based on environment
function getRedirectUri(): string {
  // In production, use the live site URL
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_URL) {
    return "https://normandesilva.vercel.app/api/auth/google/callback";
  }
  // In development, use localhost
  return "http://localhost:3000/api/auth/google/callback";
}

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/contacts.readonly",
];

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type?: string;
  scope?: string;
}

export interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
}

// Generate OAuth URL for user authorization
export function getGoogleAuthUrl(returnUrl?: string): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Client ID not configured");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: encodeURIComponent(JSON.stringify({ returnUrl: returnUrl || "/" })),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}

// Get user info from access token
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return await response.json();
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Keep the original refresh token
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}

// Get valid access token (refresh if expired)
export async function getValidAccessToken(tokens: GoogleTokens): Promise<string> {
  if (Date.now() < tokens.expires_at - 60000) {
    // Token is still valid (with 1 minute buffer)
    return tokens.access_token;
  }

  if (!tokens.refresh_token) {
    throw new Error("No refresh token available");
  }

  const newTokens = await refreshAccessToken(tokens.refresh_token);
  return newTokens.access_token;
}
