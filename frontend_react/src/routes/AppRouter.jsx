import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import ContactForm from '../components/Contact_form';
import PrivateRoute from './PrivateRoute';

const AppRouter = () =>{
  return(
  <BrowserRouter>
  <Routes>
    <Route path="/" element={<Login />} />

    {/*Ruta protegida*/}
    <Route
          path="/contact-form"
          element={
            <PrivateRoute>
              <ContactForm />
            </PrivateRoute>
          }
        />
      </Routes>
</BrowserRouter>
);
};

export default AppRouter;


