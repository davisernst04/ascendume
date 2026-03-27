"use client";

// AuthProvider is a pass-through component.
// better-auth React hooks (useSession, signIn, signUp, etc.) work directly
// without requiring a context provider, using nanostores for state.
// This component is kept for future extensibility if additional auth context is needed.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
