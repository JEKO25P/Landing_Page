import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  //para la sanitizacion de entrada
  const blockUnsafeChars = (e) => {
  const blockedChars = ['<', '>', '{', '}', '"', "'", "[", "]"];
  if (blockedChars.includes(e.key)) {
    e.preventDefault();
  }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('https://landingback.up.railway.app/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } else {
      alert(data.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Correo electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@crm.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={blockUnsafeChars}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Contraseña</label>
            <input
              type="password"
              placeholder="********"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={blockUnsafeChars}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
