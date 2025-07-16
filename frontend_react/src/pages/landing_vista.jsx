import { useNavigate } from 'react-router-dom';


export default function LandingPage() {
    const navigate = useNavigate();
    
    const handlelogin = () =>{
        navigate('/login');
    }

    const handlecontact = () =>{
        navigate('/contact-form')
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 text-gray-800">
        <header className="py-16 px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-4">
            Aprende Programación desde Cero
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-6">
            Domina lenguajes como JavaScript, Python, y más con nuestra plataforma interactiva.
            </p>
            <button
            onClick={handlelogin}
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
            >
            Iniciar Sesión
            </button>
        </header>

        <section id="beneficios" className="py-20 px-6 bg-white">
            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
            <div>
                <h3 className="text-xl font-semibold mb-2">📚 Cursos estructurados</h3>
                <p>Aprende paso a paso desde fundamentos hasta nivel avanzado.</p>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2">🧠 Prácticas interactivas</h3>
                <p>Ejercicios en vivo con retroalimentación inmediata.</p>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2">💼 Enfocado en empleabilidad</h3>
                <p>Prepara tu portafolio y CV con proyectos reales.</p>
            </div>
            </div>
        </section>

        <section className="py-16 px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">¿Estás listo para comenzar?</h2>
            <p className="mb-6">Contactanos para más detalles!</p>
            <button onClick={handlecontact} className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition">
            Contactar
            </button>
        </section>

        <footer className="bg-gray-800 text-white text-center py-6">
            <p className="text-sm">&copy; {new Date().getFullYear()} AprendeDev. Todos los derechos reservados.</p>
        </footer>
        </div>
    );
}
