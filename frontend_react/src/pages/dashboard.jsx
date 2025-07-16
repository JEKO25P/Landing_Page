import ContactTable from '../components/Contact_table'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
    const {logout} = useAuth();
    return (
        <div className="p-6 ">
            <div className='flex justify-between'>
                <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
                <button onClick={logout} className=' bg-red-500 text-white font-semibold p-2 rounded-md shadow-md hover:scale-105 mb-6'>Cerrar Sesión</button>
            </div>
        <ContactTable />
        </div>
    )
}
