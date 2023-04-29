import React, { useState } from 'react';
import { supabase } from '@/utils/client'

const SignInModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const signInWithEmailLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      console.error('Error sending magic link:', error.message);
    } else {
      console.log('Magic link sent to email:', email);
      closeModal();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signInWithEmailLink(email);
  };

  return (
    <>
      <button onClick={openModal} className="bg-blue-500 text-white px-4 py-2 rounded">
        Sign In
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded text-center">
            <h2 className="text-xl font-bold mb-4">Sign In with Magic Link</h2>
            <form onSubmit={handleSubmit} className="flex flex-col items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border border-gray-300 px-4 py-2 rounded mb-4"
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
                Send Magic Link
              </button>
            </form>
            <button onClick={closeModal} className="bg-gray-300 text-black px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SignInModal;
