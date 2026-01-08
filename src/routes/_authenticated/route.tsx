import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { useSession, signOut } from '../../lib/auth-client';
import { useEffect } from 'react';

export const Route = createFileRoute('/_authenticated')({
    component: AuthLayout,
});

function AuthLayout() {
    const navigate = Route.useNavigate();
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (!isPending && !session) {
            navigate({ to: '/login' });
        }
    }, [session, isPending, navigate]);

    if (isPending) return <p className="text-7xl">Loading...</p>

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    navigate({ to: '/' });
                },
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex gap-6">
                        <Link to="/dashboard" className="text-blue-600 font-semibold hover:text-blue-700">
                            Dashboard
                        </Link>
                        <Link to="/tasks" className="text-blue-600 font-semibold hover:text-blue-700">
                            Tasks
                        </Link>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Outlet />
            </div>
        </div>
    );
}