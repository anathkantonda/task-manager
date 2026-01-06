import { createFileRoute, Link } from '@tanstack/react-router';
import { useSession } from '../../lib/auth-client';

export const Route = createFileRoute('/_authenticated/dashboard')({
    component: Dashboard,
});

function Dashboard() {
    const { data: session } = useSession();

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome, {session?.user.name}!</h1>
            <p className="text-xl text-gray-600 mb-8">
                Your task management dashboard
            </p>
            <Link to="/tasks" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                View Tasks
            </Link>
        </div>
    );
}