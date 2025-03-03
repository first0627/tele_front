import {initializeApp} from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
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
  alert('팝업이 닫혔습니다. 다시 시도해주세요.');
  return signOut(auth);
}