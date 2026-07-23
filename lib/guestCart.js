import { cookies } from 'next/headers';

const GUEST_COOKIE_NAME = 'guestCartId';

export function getGuestId() {
  const cookieStore = cookies();
  let guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (!guestId) {
    guestId = crypto.randomUUID(); // built-in Node.js crypto
    cookieStore.set(GUEST_COOKIE_NAME, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return guestId;
}

// Optional: clear the guest cookie (e.g., after login)
export function clearGuestId() {
  const cookieStore = cookies();
  cookieStore.delete(GUEST_COOKIE_NAME);
}