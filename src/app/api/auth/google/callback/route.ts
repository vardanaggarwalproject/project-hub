import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?error=invalid_callback`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Store tokens in database
    // Check if account already exists
    const [existingAccount] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, state),
          eq(account.providerId, 'google-drive')
        )
      );

    if (existingAccount) {
      // Update existing account
      await db
        .update(account)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token || existingAccount.refreshToken,
          accessTokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(account.id, existingAccount.id));
    } else {
      // Create new account record
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: state,
        providerId: 'google-drive',
        accountId: state, // Use user ID as account ID for Drive
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Redirect back to app with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?drive_connected=true`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=callback_failed`
    );
  }
}
