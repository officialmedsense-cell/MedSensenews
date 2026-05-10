// ============================================
// MedSense News - Firebase Configuration
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyD_dhXIzFnMwNOrQA7KlQVgugWVQtrt-qo",
    authDomain: "medsense-news.firebaseapp.com",
    projectId: "medsense-news",
    storageBucket: "medsense-news.firebasestorage.app",
    messagingSenderId: "574710112714",
    appId: "1:574710112714:web:e6d0ae84ea76c6599c6f33"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
