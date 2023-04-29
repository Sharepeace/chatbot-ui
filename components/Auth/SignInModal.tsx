import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/client'

const SignInModal = () => {
    const [showModal, setShowModal] = useState(true);
    const [email, setEmail] = useState('');

    useEffect(() => {
        // Check if the user is authenticated
        const user = supabase.auth.getUser();
        console.error('User :', user);
        if (!user) {
          // If the user is not authenticated, show the modal
          setShowModal(true);
        }
    
        // Subscribe to auth state changes
        const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN') {
            // If the user is signed in, hide the modal
            setShowModal(false);
          } else if (event === 'SIGNED_OUT') {
            // If the user is signed out, show the modal
            setShowModal(true);
          }
          console.error('auth event :', event);
        });
    
        // Clean up the subscription when the component is unmounted
        return () => {
          subscription.subscription.unsubscribe();
        };
      }, []);

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
                    <div className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">

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
                            <button onClick={closeModal} className="bg-gray-300 text-black px-4 py-2 rounded">
                                Dont Save
                            </button>
                        </form>

                    </div>
                </div>
            )}
        </>
    );
};

export default SignInModal;
