import { supabase } from '@/utils/client'

export async function signInWithToken(token) {
  const response = await fetch('/api/verify-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (response.ok) {
    const { user } = await response.json();
    // Log the user in using Supabase's session management
    const { session, error } = await supabase.auth.signIn({
      user: user.id,
    });

    if (error) {
      console.error('Error logging in:', error.message);
    } else {
      console.log('User logged in successfully:', session.user);
    }
  } else {
    console.error('Token verification failed:', response.statusText);
  }
}