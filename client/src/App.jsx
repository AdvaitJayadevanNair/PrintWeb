import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Login from "./Login.jsx";
import Print from "./Print.jsx";

export default function App() {
    const [user, setUser] = useState(null);

    const firebaseConfig = {
        apiKey: "AIzaSyCUPKQEpXeCtV6i7fORcN9Oll9EIrh0Kkk",
        authDomain: "printerweb-be549.firebaseapp.com",
        projectId: "printerweb-be549",
        storageBucket: "printerweb-be549.appspot.com",
        messagingSenderId: "762255024288",
        appId: "1:762255024288:web:8cb62225fcb587bfcca9c5",
        measurementId: "G-FXPF5SPH29"
    };
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
    }, []);

    if (!user) {
        return <Login auth={auth} />;
    }

    return (
        <Print {...{ user, db, storage }} />
    )
}