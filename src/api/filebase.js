import {initializeApp} from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {get, getDatabase, ref} from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({prompt: 'select_account'});
provider.setCustomParameters({dipslay: 'popup'});

export function login() {
  signInWithPopup(auth, provider).catch(console.error);
}

export function logout() {
  signOut(auth).catch(console.error);
}

export function onUserStateChanged(callback) {
  onAuthStateChanged(auth, async (user) => {
    //1. 사용자가 있는 경우에 (로그인한경우)
    const updatedUser = user ? await adminUser(user) : null;
    console.log(updatedUser);
    callback(updatedUser);
  });
}

async function adminUser(user) {
  //2. 사용자가 어드민 권한을 가지고 있는지 확인!
  //3. {...user, isAdmin: true/false}
  return get(ref(db, 'admins'))//
      .then((snapshot) => {
        if (snapshot.exists()) {
          const admins = snapshot.val();
          const isAdmin = admins.includes(user.uid);
          return {...user, isAdmin};
        }
        return user;
      });
}