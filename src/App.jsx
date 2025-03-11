import {Outlet} from 'react-router-dom';
import Navbar from './components/Navbar';
import {AuthContextProvider} from './components/context/AuthContext.jsx';

function App() {
  return (
      <AuthContextProvider>
        <Navbar/>
        <Outlet/>
      </AuthContextProvider>
  );
}

export default App;
