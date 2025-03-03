import {initializeApp} from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({prompt: 'select_account'});
provider.setCustomParameters({dipslay: 'popup'});

export async function login() {
  return signInWithPopup(auth, provider).then((result) => {
    const user = result.user;
    console.log('🔐 인증 결과:', user);
    return user;
  }).catch(console.error);
}

export async function logout() {

  return signOut(auth);
}

export function onUserStateChanged(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}