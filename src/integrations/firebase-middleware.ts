import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { adminAuth, adminDb, adminStorage } from "./firebase-admin";

export const requireFirebaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Only Bearer tokens are supported");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    try {
      if (!adminAuth) {
        throw new Error("Firebase Admin SDK is not initialized.");
      }
      const decodedToken = await adminAuth.verifyIdToken(token);
      return next({
        context: {
          adminDb,
          adminStorage,
          userId: decodedToken.uid,
          decodedToken,
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Unauthorized: Invalid token (${msg})`);
    }
  },
);
