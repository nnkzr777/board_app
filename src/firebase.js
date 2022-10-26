import { initializeApp } from 'firebase/app'
import 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxm9Qx6IP0YlOkAcZbcfxNfFPHu06A6Mg",
    authDomain: "board-app-55e87.firebaseapp.com",
    projectId: "board-app-55e87",
    storageBucket: "board-app-55e87.appspot.com",
    messagingSenderId: "236122647390",
    appId: "1:236122647390:web:8cec96a503b1874f62bdcf"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
