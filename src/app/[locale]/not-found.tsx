'use client';

import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileQuestion className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Página no encontrada</h1>
                    <p className="text-muted-foreground mt-2">
                        El recurso que buscas no existe o ha sido eliminado.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                    >
                        Volver atrás
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        Ir al Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
