import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const apps = getApps();
export const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
export const auth = isFirebaseConfigured ? getAuth(app) : null;

export const createFirebaseRecaptchaVerifier = async (containerId) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured");
  }

  if (typeof window === "undefined") {
    throw new Error("RecaptchaVerifier requires a browser environment");
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Recaptcha container not found: ${containerId}`);
  }

  const { RecaptchaVerifier } = await import("firebase/auth");
  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  container.innerHTML = "";

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });

  window.recaptchaVerifier = verifier;
  await verifier.render();
  return verifier;
};