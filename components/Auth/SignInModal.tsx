import React, { useState } from 'react';
import { supabase } from '@/utils/client'

const SignInModal = () => {
  const [showModal, setShowModal] = useState(true);
  const [email, setEmail] = useState('');

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
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div  className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
            
            <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 ">Save Your Work!</h2>
            <p className="text-sm font-bold mb-4 ">Sign In with Magic Link</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border text-black border-gray-300 px-4 py-2 rounded mb-4"
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
                Send Magic Link
              </button>
              {/* <button onClick={closeModal} className="bg-gray-300 text-black px-4 py-2 rounded">
                Dont Save
            </button> */}
            </form>
            
          </div>
        </div>
      )}
    </>
  );
};

export default SignInModal;
