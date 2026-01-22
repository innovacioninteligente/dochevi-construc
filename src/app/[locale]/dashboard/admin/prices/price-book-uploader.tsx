
'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ingestPriceBookAction } from '@/actions/price-book/ingest-price-book.action';
import { checkIngestionJobStatus } from '@/actions/price-book/check-job-status.action';
import { Progress } from "@/components/ui/progress"
interface PriceBookUploaderProps {
    locale: string;
    onUploadComplete?: () => void;
}

export function PriceBookUploader({ locale, onUploadComplete }: PriceBookUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [jobId, setJobId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear()); // Default to current
    const { toast } = useToast();
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Polling Effect
    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            const result = await checkIngestionJobStatus(jobId);
            if (result.success && result.job) {
                const job = result.job;
                setProgress(job.progress);

                if (job.status === 'processing') {
                    setStatusMessage(`Procesando: ${job.progress}%`);
                    if (job.logs && Array.isArray(job.logs)) {
                        setLogs(job.logs);
                    }
                }

                if (job.status === 'completed') {
                    setJobId(null);
                    setIsProcessing(false);
                    setProgress(100);
                    setStatusMessage('¡Completado!');
                    toast({
                        title: "Proceso finalizado",
                        description: `Se han importado ${job.totalItems} partidas.`,
                    });
                    setFile(null);
                    if (onUploadComplete) onUploadComplete();
                }

                if (job.status === 'failed') {
                    setJobId(null);
                    setIsProcessing(false);
                    setStatusMessage('Error');
                    toast({
                        title: "Error en el proceso",
                        description: job.error || "Ocurrió un error desconocido",
                        variant: "destructive"
                    });
                }
            }
        }, 2000); // Check every 2 seconds

        return () => clearInterval(interval);
    }, [jobId, toast, onUploadComplete]);


    const onDrop = (e: any) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'application/pdf') {
            setFile(droppedFile);
        } else {
            toast({
                title: "Formato incorrecto",
                description: "Por favor, sube un archivo PDF.",
                variant: 'destructive',
            });
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setIsUploading(true);
            setStatusMessage('Subiendo archivo...');

            // 1. Upload to Firebase Storage
            const storage = getStorage();
            const storageRef = ref(storage, `price-books/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            setIsUploading(false);
            setIsProcessing(true);
            setStatusMessage('Iniciando proceso de IA...');

            // 2. Trigger Server Action (Async Job)
            const result = await ingestPriceBookAction(url, file.name, year);

            if (result.success && result.jobId) {
                setJobId(result.jobId);
                toast({
                    title: "Proceso iniciado",
                    description: "La IA está procesando el documento en segundo plano.",
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error: any) {
            console.error(error);
            setIsUploading(false);
            setIsProcessing(false);
            toast({
                title: "Error",
                description: error.message || "Error al subir el archivo",
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="w-full">
            <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
            >
                {/* Visual State: Processing/Polling */}
                {(isProcessing || jobId) ? (
                    <div className="flex flex-col items-center justify-center space-y-4 w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="space-y-1 w-full text-center">
                            <p className="font-medium">{statusMessage}</p>
                            <Progress value={progress} className="w-[80%] mx-auto h-2" />
                        </div>

                        {/* Status / Logs Area */}
                        <div className="w-full mt-4 bg-muted/20 p-4 rounded-md h-40 overflow-y-auto text-xs font-mono text-left border">
                            {logs.length > 0 ? logs.map((log, i) => (
                                <div key={i} className="py-0.5 border-b border-muted/50 last:border-0">
                                    <span className="text-muted-foreground mr-2">{new Date().toLocaleTimeString()}</span>
                                    {log}
                                </div>
                            )) : (
                                <p className="text-muted-foreground italic">Esperando logs...</p>
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                ) : (
                    // Default State
                    <>
                        <div className="flex justify-center mb-4">
                            {file ? <FileText className="h-10 w-10 text-primary" /> : <Upload className="h-10 w-10 text-muted-foreground" />}
                        </div>
                        {file ? (
                            <div className="space-y-2">
                                <p className="font-medium text-lg">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="font-medium text-lg">Arrastra tu PDF aquí o haz clic para buscar</p>
                                <p className="text-sm text-muted-foreground">Soporta archivos PDF</p>
                            </div>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            id="file-upload"
                            accept=".pdf"
                            onChange={(e) => {
                                if (e.target.files) setFile(e.target.files[0]);
                            }}
                        />
                        {!file && (
                            <label htmlFor="file-upload" className="mt-4 inline-block cursor-pointer px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium">
                                Seleccionar Archivo
                            </label>
                        )}
                    </>
                )}
            </div>

            {/* Year Selector */}
            <div className="mt-4 flex items-center justify-end space-x-2">
                <label className="text-sm font-medium">Año de Vigencia:</label>
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="border rounded px-2 py-1 w-20 text-center"
                />
            </div>

            {/* Upload Button */}
            {file && !isProcessing && !jobId && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
                    >
                        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isUploading ? 'Subiendo...' : 'Procesar con IA'}
                    </button>
                </div>
            )}
        </div>
    );
}


