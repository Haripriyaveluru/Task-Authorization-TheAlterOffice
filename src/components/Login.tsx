import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import "./Login.css";
import { auth, provider } from './Firebase';
import { useTaskContext } from "../context/Context";
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from "./Firebase";

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUserDetails } = useTaskContext();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userInfo = {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid
                };
                setUserDetails(userInfo);
                navigate('/home');
            }
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, [navigate, setUserDetails]);


    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            if (user) {
                const userInfo = {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid
                };
                setUserDetails(userInfo);
                localStorage.setItem('userDetails', JSON.stringify(userInfo));

                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    await setDoc(userRef, userInfo);

                    console.log('User document created');
                } else {
                    console.log('User document already exists');
                }

                navigate('/home');
            } else {
                throw new Error('User information missing');
            }
        } catch (error) {
            console.error(error);
            alert('Error logging in with Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="login-container">
            <div className="login-left">
                <h2><span className="material-symbols-outlined">assignment</span> Task Buddy</h2>
                <p> Streamline your workflow and track progress effortlessly with our all-in-one task management app.</p>
                <button onClick={handleGoogleSignIn} disabled={loading}>
                    <i className="fab fa-google"></i>
                    {loading ? 'Logging in...' : 'Continue with Google'}
                </button>
            </div>

        </div>
    );
};


export default Login;
