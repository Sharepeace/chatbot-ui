import { supabase } from '@/utils/client';

interface UserResponse {
  user: {
    id: string;
  };
}

export async function signInWithToken(token: string): Promise<void> {
  const response = await fetch('/api/verify-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (response.ok) {
    const { user } = (await response.json()) as UserResponse;
    // Log the user in using Supabase's session management
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error logging in:', error.message);
    } else {
      console.log('User logged in successfully:', data?.session?.user);
    }
  } else {
    console.error('Token verification failed:', response.statusText);
  }
}
