// pages/api/verify-token.ts
import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/client';

interface DecodedPayload {
  token: string,
  botId: string;
  subscriptionStatus: string;
  exp: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.body;

  try {

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as DecodedPayload;

    // Fetch the user's information from Supabase using their user ID
    const { data: user, error } = await supabase.auth.getUser(decoded.token);
    console.log('Current bot id: ', decoded.botId);
    localStorage.setItem('bot_id', decoded.botId);

    if (error) {
      res.status(400).json({ message: 'Error fetching user information from Supabase', error: error.message });
    } else {
      res.status(200).json({ user });
    }
  } catch (err: any) {
    res.status(401).json({ message: 'Error fetching user information from Supabase or verifying token', error: err.message });
  }
}
