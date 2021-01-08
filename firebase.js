const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/functions');
require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCpUlt4FCDOlWimbhjnGCP1gN4CxKpz8m4",
    authDomain: "pea-rg4-dashboard.firebaseapp.com",
    databaseURL: "https://pea-rg4-dashboard.firebaseio.com",
    projectId: "pea-rg4-dashboard",
    storageBucket: "pea-rg4-dashboard.appspot.com",
    messagingSenderId: "592096793574",
    appId: "1:592096793574:web:df28de01bbe8493b307c27",
    measurementId: "G-P07BYPYZGP"
};

firebase.initializeApp(firebaseConfig);

if (window.location.hostname === 'localhost') {
  console.log("testing locally -- hitting local functions and firestore emulators");
  firebase.functions().useFunctionsEmulator('http://localhost:5001');
  firebase.firestore().settings({
    host: 'localhost:8080',
    ssl: false
  });
}

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export const functions = firebase.functions();
export const db = firebase.firestore();
export const fieldval = firebase.firestore.FieldValue;
export default firebase;