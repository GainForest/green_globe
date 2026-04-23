import { create } from "zustand";

/** A resolved ATProto user profile. */
export type User = {
  did: string;
  handle?: string;
  displayName?: string;
  avatar?: string;
};

/**
 * Discriminated union catalog for ATProto authentication state.
 * - `unauthenticated`: session resolved, no user logged in.
 * - `authenticated`: session resolved, user is logged in.
 * - `resuming`: session check in progress (initial load).
 */
export type AtprotoAuthCatalog = {
  unauthenticated: {
    status: "UNAUTHENTICATED";
    authenticated: false;
    user: null;
  };
  authenticated: {
    status: "AUTHENTICATED";
    authenticated: true;
    user: User;
  };
  resuming: {
    status: "RESUMING";
    authenticated: false;
    user: null;
  };
};

/** State slice of the ATProto Zustand store. */
export type AtprotoStoreState = {
  /** Whether the initial session check has completed. */
  isReady: boolean;
  /** Current authentication state (discriminated union). */
  auth: AtprotoAuthCatalog[keyof AtprotoAuthCatalog];
};

/** Actions slice of the ATProto Zustand store. */
export type AtprotoStoreActions = {
  /**
   * Set the authenticated user. Pass `null` to mark the session as
   * unauthenticated. In both cases `isReady` is set to `true`.
   */
  setAuth: (user: User | null) => void;
  /**
   * Mark the session as resuming (e.g. on page load before the session
   * check completes). Sets `isReady` to `false`.
   */
  setResuming: () => void;
};

/**
 * Zustand store for managing ATProto authentication state on the client.
 *
 * Initial state is `RESUMING` with `isReady: false`. Once the session check
 * completes, call `setAuth(user)` to transition to `AUTHENTICATED` or
 * `UNAUTHENTICATED`.
 */
export const useAtprotoStore = create<AtprotoStoreState & AtprotoStoreActions>(
  (set) => ({
    isReady: false,
    auth: { status: "RESUMING", authenticated: false, user: null },

    setAuth: (user) => {
      if (user) {
        set({
          isReady: true,
          auth: { status: "AUTHENTICATED", authenticated: true, user },
        });
      } else {
        set({
          isReady: true,
          auth: { status: "UNAUTHENTICATED", authenticated: false, user: null },
        });
      }
    },

    setResuming: () => {
      set({
        isReady: false,
        auth: { status: "RESUMING", authenticated: false, user: null },
      });
    },
  })
);
