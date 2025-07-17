import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import ContactForm from '../components/Contact_form';
import PrivateRoute from './PrivateRoute';
import LandingPage from '../pages/landing_vista';
import Dashboard from '../pages/dashboard';
const AppRouter = () =>{
  return(
  <BrowserRouter>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />

    {/*Ruta protegida*/}
    <Route
          path="/contact-form"
          element={
            <ContactForm />
          }
    />
    <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
    />
      </Routes>
</BrowserRouter>
);
};

export default AppRouter;


