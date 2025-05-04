import PocketBase from 'pocketbase';

if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) {
  throw new Error('NEXT_PUBLIC_POCKETBASE_URL is not defined in environment variables');
}

// Create a single instance of PocketBase to be shared across the app
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Function to load auth from cookies
export async function loadAuthFromCookies() {
  if (typeof window === 'undefined') return false;

  try {
    // First, try to get the auth data from the server
    const response = await fetch('/api/auth/session');
    if (!response.ok) {
      console.error('Error getting session:', response.statusText);
      return false;
    }

    const session = await response.json();
    console.log('Session data:', session);

    if (!session.token) {
      console.log('No auth token in session');
      return false;
    }

    // Set the auth data in PocketBase
    pb.authStore.save(session.token, session.model);
    
    // Verify the loaded state
    const authState = {
      isValid: pb.authStore.isValid,
      model: pb.authStore.model?.id,
      token: pb.authStore.token ? 'present' : 'missing'
    };
    console.log('Auth state after loading:', authState);
    
    return pb.authStore.isValid;
  } catch (error) {
    console.error('Error loading auth from session:', error);
    return false;
  }
}

// Initialize auth state if in browser
if (typeof window !== 'undefined') {
  loadAuthFromCookies();
}

// Add event listeners for auth state changes
pb.authStore.onChange(() => {
  const authState = {
    isValid: pb.authStore.isValid,
    model: pb.authStore.model?.id,
    token: pb.authStore.token ? 'present' : 'missing'
  };
  console.log('Auth state changed:', authState);
});

export default pb; 