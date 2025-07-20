import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { useNavigate } from 'react-router-dom';


const API_URL = 'https://landingback.up.railway.app'
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaValid, setRecaptchaValid] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate();
  const handleback = () =>{
    navigate(-1);
  }

  //para la sanitizacion de entrada
  const blockUnsafeChars = (e) => {
  const blockedChars = ['<', '>', '{', '}', '"', "'", "[", "]"];
  if (blockedChars.includes(e.key)) {
    e.preventDefault();
  }
  };

  useEffect(() => {
    // Cargar reCAPTCHA
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    window.onRecaptchaSuccess = (token) => {
      setRecaptchaToken(token)
      setRecaptchaValid(true)
      showMessage('¡Verificación completada! Ya puedes enviar el formulario.', 'success')
    }

    window.onRecaptchaExpired = () => {
      resetRecaptcha()
      showMessage('La verificación ha expirado. Por favor, verifica de nuevo.', 'error')
    }

    window.onRecaptchaError = () => {
      resetRecaptcha()
      showMessage('Error al cargar reCAPTCHA. Recarga la página.', 'error')
    }
  }, [])

  const resetRecaptcha = () => {
    setRecaptchaToken('')
    setRecaptchaValid(false)
    if (window.grecaptcha) {
      window.grecaptcha.reset()
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 6000)
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!recaptchaToken || !recaptchaValid) {
    showMessage('Por favor, completa la verificación de reCAPTCHA', 'error');
    return;
  }

  const { name, email, message } = form;
  if (!name || !email || !message) {
    showMessage('Por favor, completa todos los campos obligatorios.', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage('Por favor, ingresa un email válido.', 'error');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, token: recaptchaToken }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showMessage('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');

      // ✅ Enviar correo con EmailJS aquí dentro
      emailjs.send(
        'service_h3q797j',
        'template_w7ce60p',
        {
          user_name: form.name,
          user_email: form.email,
          user_message: form.message,
        },
        'kbFBPttnT6sPxNlk0'
      )
      .then((res) => {
        console.log('📧 Correo enviado con éxito:', res.status);
      })
      .catch((err) => {
        console.error('❌ Error al enviar el correo:', err);
      });

      setForm({ name: '', email: '', phone: '', message: '' });
      resetRecaptcha();
    } else {
      throw new Error(result.error || 'Error al enviar el mensaje');
    }
  } catch (err) {
    showMessage(err.message || 'Error de conexión. Inténtalo de nuevo.', 'error');
  } finally {
    setLoading(false);
  }
  };


  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 max-w-xl w-full space-y-6">
        <div className='flex items-center justify-between'>
          <button 
          onClick={handleback}
          className=' bg-red-500 text-white font-semibold p-1 rounded-full shadow-md hover:scale-105'>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-center text-blue-700 w-full -ml-6">Contáctanos</h1>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-5" id="contactForm">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Nombre completo</label>
            <input
              type="text"
              name="name"
              placeholder="Tu nombre"
              value={form.name}
              onChange={handleChange}
              onKeyDown={blockUnsafeChars}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div>
            <label className="block text-gray-700 font-medium mb-1">Correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="tucorreo@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              onKeyDown={blockUnsafeChars}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div>
            <label className="block text-gray-700 font-medium mb-1">Teléfono (opcional)</label>
            <input
              type="tel"
              name="phone"
              placeholder="55 1234 5678"
              value={form.phone}
              onChange={handleChange}
              onKeyDown={blockUnsafeChars}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div>
            <label className="block text-gray-700 font-medium mb-1">Mensaje</label>
            <textarea
              name="message"
              placeholder="Escribe tu mensaje aquí..."
              value={form.message}
              onChange={handleChange}
              onKeyDown={blockUnsafeChars}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md h-32 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div className="flex justify-center py-2 g-recaptcha-container">
            <div
              className="g-recaptcha"
              data-sitekey={SITE_KEY}
              data-callback="onRecaptchaSuccess"
              data-expired-callback="onRecaptchaExpired"
              data-error-callback="onRecaptchaError"
            ></div>
          </div>
  
          <button
            type="submit"
            disabled={!recaptchaValid || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Enviando...
              </div>
            ) : (
              'Enviar mensaje'
            )}
          </button>
        </form>
  
        {message.text && (
          <div
            className={`px-4 py-3 rounded-md text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
  
}

export default ContactForm
