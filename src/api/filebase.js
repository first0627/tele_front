import {initializeApp} from 'firebase/app';
import {
  browserPopupRedirectResolver,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
};

// Initialize Firebase
initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({prompt: 'select_account'});

const auth = getAuth();

export function login() {
  signInWithPopup(auth, provider, browserPopupRedirectResolver).
      then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        // The signed-in user info.
        const user = result.user;
        // Use the token and user information as need ed
        console.log('Token:', credential.accessToken);
        console.log('User:', user);
      }).
      catch((error) => {
        // Handle Errors here.
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        // The email of the user's account used.
        console.error('Email:', error.customData.email);
        // The AuthCredential type that was used.
        console.error('Credential:',
            GoogleAuthProvider.credentialFromError(error));
      });
}