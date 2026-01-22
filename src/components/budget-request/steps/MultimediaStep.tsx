import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

interface MultimediaStepProps {
    form: UseFormReturn<DetailedFormValues>;
    t: any;
}

export const MultimediaStep = ({ form, t }: MultimediaStepProps) => {
    const [isUploading, setIsUploading] = useState(false);

    // NOTE: This is a placeholder for the actual Firebase Storage integration.
    // In the future, this will handle the file upload and return a URL.
    // For now, we simulate an upload and add a fake URL string to the 'files' array.

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const newFiles = Array.from(e.target.files);

            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const currentFiles = form.getValues('files') || [];
            // Mock URLs for now - In production this comes from Firebase Storage
            const uploadedUrls = newFiles.map(file => URL.createObjectURL(file));

            form.setValue('files', [...currentFiles, ...uploadedUrls]);
            setIsUploading(false);

            // Reset input
            e.target.value = '';
        }
    };

    const removeFile = (index: number) => {
        const currentFiles = form.getValues('files') || [];
        const newFiles = currentFiles.filter((_, i) => i !== index);
        form.setValue('files', newFiles);
    };

    const files = form.watch('files') || [];

    return (
        <div className="space-y-6 text-left">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="flex items-center gap-2 font-semibold text-blue-900">
                    <ImageIcon className="w-5 h-5" />
                    Fotos del Estado Actual
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                    Sube fotos de las estancias a reformar. Esto ayuda enormemente a la IA a entender el contexto y generar un presupuesto más preciso.
                </p>
            </div>

            <FormField
                control={form.control}
                name="files"
                render={() => (
                    <FormItem>
                        <FormLabel>Añadir Imágenes</FormLabel>
                        <FormControl>
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {isUploading ? 'Subiendo...' : 'Seleccionar Fotos'}
                                </Button>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <FormDescription>
                                    Formatos aceptados: JPG, PNG. Máx 5MB.
                                </FormDescription>
                            </div>
                        </FormControl>
                        <FormMessage />

                        {/* Gallery Preview */}
                        {files.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                {files.map((url, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                        <img src={url} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {files.length === 0 && (
                            <div className="mt-6 border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                <p>No has subido ninguna foto todavía.</p>
                            </div>
                        )}

                    </FormItem>
                )}
            />
        </div>
    );
};
