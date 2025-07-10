import React, { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000'
const SITE_KEY = '6Lf2724rAAAAAEUK10pIJpgNENoosBe5hIzQk-6j'

const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaValid, setRecaptchaValid] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

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
    e.preventDefault()
    if (!recaptchaToken || !recaptchaValid) {
      showMessage('Por favor, completa la verificación de reCAPTCHA', 'error')
      return
    }

    const { name, email, message } = form
    if (!name || !email || !message) {
      showMessage('Por favor, completa todos los campos obligatorios.', 'error')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showMessage('Por favor, ingresa un email válido.', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, 'g-recaptcha-response': recaptchaToken }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        showMessage('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success')
        setForm({ name: '', email: '', phone: '', message: '' })
        resetRecaptcha()
      } else {
        throw new Error(result.error || 'Error al enviar el mensaje')
      }
    } catch (err) {
      showMessage(err.message || 'Error de conexión. Inténtalo de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-center text-gray-800">Contáctanos</h1>
      <form onSubmit={handleSubmit} className="space-y-4" id="contactForm">
        <input
          type="text"
          name="name"
          placeholder="Nombre completo"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Teléfono (opcional)"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          name="message"
          placeholder="Mensaje"
          value={form.message}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md h-32 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
            'Enviar'
          )}
        </button>
      </form>

      {message.text && (
        <div
          className={`mt-4 px-4 py-3 rounded border text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

export default ContactForm
