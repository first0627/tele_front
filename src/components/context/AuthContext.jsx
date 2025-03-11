import {createContext, useContext, useEffect, useState} from 'react';
import {login, logout, onUserStateChanged} from '../../api/filebase.js';

const AuthContext = createContext();

export function AuthContextProvider({children}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onUserStateChanged(user => setUser(user));
  }, []);
  return <AuthContext.Provider value={{
    user,
    login,
    logout,
  }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}

