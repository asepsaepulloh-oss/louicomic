import React, { createContext, useContext, ReactNode } from 'react';
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton, useUser, useClerk } from '@clerk/clerk-react';

interface AuthContextType {
  userId: string;
  userName: string;
  userEmail: string | null;
  userAvatar: string;
  isSignedIn: boolean;
  isClerkConfigured: boolean;
  openSignInModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userId: 'guest',
  userName: 'Tamu / Guest',
  userEmail: null,
  userAvatar: '',
  isSignedIn: false,
  isClerkConfigured: false,
  openSignInModal: () => {},
});

export const useAuth = () => useContext(AuthContext);

const rawClerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkPubKey = rawClerkPubKey ? rawClerkPubKey.trim().replace(/^["']|["']$/g, '') : '';

export const isClerkConfigured = Boolean(
  clerkPubKey && clerkPubKey.startsWith('pk_') && clerkPubKey.length > 20
);

/**
 * Inner component when ClerkProvider is active
 */
function ClerkAuthInner({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const userId = user?.id || 'guest';
  const userName = user?.fullName || user?.firstName || user?.username || 'Pembaca Komik';
  const userEmail = user?.primaryEmailAddress?.emailAddress || null;
  const userAvatar = user?.imageUrl || '';

  return (
    <AuthContext.Provider
      value={{
        userId,
        userName,
        userEmail,
        userAvatar,
        isSignedIn: Boolean(isSignedIn),
        isClerkConfigured: true,
        openSignInModal: () => openSignIn(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Main Auth Provider wrapper that handles both configured Clerk and Guest mode
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (isClerkConfigured && clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ClerkAuthInner>{children}</ClerkAuthInner>
      </ClerkProvider>
    );
  }

  // Fallback when Clerk is not configured yet
  return (
    <AuthContext.Provider
      value={{
        userId: 'guest',
        userName: 'Mode Tamu (Guest)',
        userEmail: null,
        userAvatar: '',
        isSignedIn: false,
        isClerkConfigured: false,
        openSignInModal: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
