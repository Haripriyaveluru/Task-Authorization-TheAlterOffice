import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './Firebase';
import { useTaskContext } from '../context/Context';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const navigate = useNavigate();
    const { setUserDetails } = useTaskContext();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate('/');
            } else {
                const userInfo = {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid
                };
                setUserDetails(userInfo);
            }
        });

        return () => unsubscribe();
    }, [navigate, setUserDetails]);

    return <>{children}</>;
};

export default ProtectedRoute;