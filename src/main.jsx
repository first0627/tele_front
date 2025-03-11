import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import NotFound from './pages/NotFound.jsx';
import Home from './pages/Home.jsx';
import AllProducts from './pages/AllProducts.jsx';
import NewProduct from './pages/NewProduct.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import MyCart from './pages/MyCart.jsx';
import ProtectedRoute from './pages/ProtectedRoute.jsx';

const router =
    createBrowserRouter([
      {
        path: '/',
        element: <App/>,
        errorElement: <NotFound/>,
        children: [
          {index: true, element: <Home/>},
          {path: 'products', element: <AllProducts/>},
          {
            path: 'products/new',
            element: <ProtectedRoute requireAdmin>
              <NewProduct/></ProtectedRoute>,
          },
          {path: 'products/:id', element: <ProductDetail/>},
          {path: 'carts', element: <ProtectedRoute> <MyCart/></ProtectedRoute>},
        ],
      },
    ]);

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
    <StrictMode>
      <RouterProvider router={router}/>
    </StrictMode>,
);
