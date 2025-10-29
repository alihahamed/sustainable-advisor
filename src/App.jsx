import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import CompareProducts from './pages/CompareProducts.jsx';
import Favourites from './pages/Favourites.jsx';
import LoginRegister from './pages/LoginRegister.jsx';
import Profile from './pages/Profile.jsx';
import { useState, useEffect } from 'react';
import { SplashScreen, SplashScreenAnimated, SplashScreenMinimal } from './pages/splashScreen.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!isAuthenticated) {
    // Remember where they were trying to go
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
};


function App() {

  const [showSplash, setShowSplash] = useState(true)
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
    navigate('/login');
  };

  useEffect(() => {
    const seenSplash = localStorage.getItem('hasSeenSplash')
    if(seenSplash) {
      setShowSplash(false)

    }
  }, [])

  if(showSplash) {
    return <SplashScreenAnimated onGetStarted={handleGetStarted} />
  }

  return (

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<ProductDetails />} />
        <Route path="/compare" element={<CompareProducts />} />
        <Route path="/favourites" element={
          <ProtectedRoute>
            <Favourites />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<LoginRegister />} />
      </Routes>

  );
}

export default App;
