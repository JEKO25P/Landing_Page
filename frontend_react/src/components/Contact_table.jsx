import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://3227.efdiaz.xyz'

const estados = ['nuevo', 'contactado', 'descartado']

export default function ContactTable() {
  const [contacts, setContacts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.warn('No hay token, redirigiendo al login...')
          navigate('/login') // Redirige si no hay token
          return
        }

        const res = await fetch(`${API_URL}/api/contacts`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          if (res.status === 401) {
            alert('Sesión expirada. Inicia sesión nuevamente.')
            navigate('/login')
          }
          throw new Error('Error al obtener contactos')
        }

        const data = await res.json()
        setContacts(data)
      } catch (err) {
        console.error('Error al cargar contactos:', err)
      }
    }

    fetchContacts()
  }, [navigate])

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/contacts/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setContacts(contacts.map(c => c.id === id ? { ...c, status: newStatus } : c))
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err)
    }
  }

  // Paginación
  const indexOfLast = currentPage * itemsPerPage
  const indexOfFirst = indexOfLast - itemsPerPage
  const currentItems = contacts.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(contacts.length / itemsPerPage)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Tabla de Contactos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-xl border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4">Nombre</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Teléfono</th>
              <th className="py-2 px-4">Mensaje</th>
              <th className="py-2 px-4">Estado</th>
              <th className="py-2 px-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((contact) => (
              <tr key={contact.id} className="border-t">
                <td className="py-2 px-4">{contact.name}</td>
                <td className="py-2 px-4">{contact.email}</td>
                <td className="py-2 px-4">{contact.phone}</td>
                <td className="py-2 px-4">{contact.message}</td>
                <td className="py-2 px-4 font-semibold text-sm capitalize">{contact.status}</td>
                <td className="py-2 px-4">
                  <select
                    value={contact.status}
                    onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {estados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === i + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
