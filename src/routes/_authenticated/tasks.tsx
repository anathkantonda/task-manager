import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { createServerFn, createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { db } from '../../db';
import { tasks as tasksTable, type Task } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '../../lib/auth';
import { useSession } from '../../lib/auth-client';
import { z } from 'zod';

const CreateTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().optional(),
});

const UpdateStatusSchema = z.object({
    id: z.string(), 
    status: z.enum(['todo', 'in_progress', 'done']),
});

const authMiddleware = createMiddleware()
  .server(async ({ next }) => {
    const req = getRequest();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      throw new Error("Unauthorized");
    }

    return next({
      context: {
        user: session.user,
      },
    });
  });

const getTasks = createServerFn({ method: 'GET' })
    .middleware([authMiddleware])
    .handler(async ({ context }) => {
        return db
            .select()
            .from(tasksTable)
            .where(eq(tasksTable.userId, context.user.id))
            .orderBy(desc(tasksTable.createdAt));
    });

const createTask = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(CreateTaskSchema)
    .handler(async ({ data, context }) => {
        const [newTask] = await db.insert(tasksTable).values({
            title: data.title,
            description: data.description,
            userId: context.user.id,
            status: 'todo',
        }).returning();
        
        return newTask;
    });

const updateTaskStatus = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(UpdateStatusSchema)
    .handler(async ({ data }) => {
        await db.update(tasksTable)
            .set({ status: data.status })
            .where(eq(tasksTable.id, data.id));
            
        return { success: true };
    });

const deleteTask = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.string())
    .handler(async ({ data }) => {
        await db.delete(tasksTable).where(eq(tasksTable.id, data));
        return { success: true };
    });

export const Route = createFileRoute('/_authenticated/tasks')({
    loader: async () => await getTasks(),
    component: TasksPage,
});

function TasksPage() {
    const initialTasks = Route.useLoaderData();
    const { data: session } = useSession();
    
    const [taskList, setTaskList] = useState<Task[]>(initialTasks);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) return;

        setIsCreating(true);
        try {
            const newTask = await createTask({ 
                data: { title, description: description || undefined } 
            });
            setTaskList((prev) => [newTask, ...prev]);
            setTitle('');
            setDescription('');
        } catch (err) {
            console.error("Server Error:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleStatusChange = async (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
        setTaskList((prev) => prev.map(task => task.id === taskId ? { ...task, status } : task));
        await updateTaskStatus({ data: { id: taskId, status } });
    };

    const handleDelete = async (taskId: string) => {
        setTaskList((prev) => prev.filter(task => task.id !== taskId));
        await deleteTask({ data: taskId });
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-4xl font-bold mb-8">My Tasks</h1>

            <section className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                <form onSubmit={handleCreate} className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        type="submit" 
                        disabled={isCreating} 
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {isCreating ? 'Adding...' : 'Add Task'}
                    </button>
                </form>
            </section>

            <div className="space-y-4">
                {taskList.map((task) => (
                    <div key={task.id} className="bg-white rounded-xl border p-5 flex justify-between items-center">
                        <div className="flex-1 mr-4">
                            <h3 className="font-bold text-lg">{task.title}</h3>
                            {task.description && <p className="text-gray-500 text-sm">{task.description}</p>}
                        </div>
                        <div className="flex gap-4 items-center">
                            <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                                className="border rounded p-1 text-sm bg-gray-50"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                            <button 
                                onClick={() => handleDelete(task.id)} 
                                className="text-red-500 hover:text-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}