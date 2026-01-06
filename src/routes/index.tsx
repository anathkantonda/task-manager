import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Task Manager</h1>
        <p className="text-xl text-gray-600 mb-8">Simple task management with TanStack Start</p>
        <div className="flex gap-4 justify-center">
          <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Login
          </Link>
          <Link to="/register" className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
