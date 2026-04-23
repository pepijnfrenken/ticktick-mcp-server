#!/usr/bin/env node
import { TickTickAuth } from './common/auth.js';
import dotenv from 'dotenv';

export async function main(): Promise<{
  message: string;
  ok: boolean;
}> {
  dotenv.config();

  const clientId = process.env.TICKTICK_CLIENT_ID;
  const clientSecret = process.env.TICKTICK_CLIENT_SECRET;
  const accessToken = process.env.TICKTICK_ACCESS_TOKEN;
  const redirectUri = 'http://localhost:8000/callback';
  const port = 8000;

  // If we already have an access token, we're good — skip auth flow
  if (accessToken) {
    console.error(
      'Access token is already set. No need to authorize again.'
    );
    return {
      message: 'Access token is already set. No need to authorize again.',
      ok: true,
    };
  }

  // No token — need client ID/secret to run OAuth flow
  if (!clientId || !clientSecret) {
    console.error(
      'Error: TICKTICK_ACCESS_TOKEN is missing, and TICKTICK_CLIENT_ID / TICKTICK_CLIENT_SECRET are not set.'
    );
    console.error(
      'Either provide an existing TICKTICK_ACCESS_TOKEN, or set CLIENT_ID and CLIENT_SECRET to generate one.'
    );
    return {
      message:
        'Missing credentials. Set TICKTICK_ACCESS_TOKEN, or TICKTICK_CLIENT_ID + TICKTICK_CLIENT_SECRET.',
      ok: false,
    };
  }

  const auth = new TickTickAuth({
    clientId,
    clientSecret,
    redirectUri,
    port,
  });

  const result = await auth.startAuthFlow();
  console.error(result);
  return result;
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].includes('ticktick-auth')
) {
  main().catch(console.log);
}
