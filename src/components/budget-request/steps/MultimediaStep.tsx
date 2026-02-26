import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2, Upload, X, Image as ImageIcon, Wand2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateRenovationAction } from '@/actions/ai/generate-renovation.action';
import { ImageComparisonSlider } from '@/components/ui/image-comparison';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MultimediaStepProps {
    form: UseFormReturn<DetailedFormValues>;
    t: any;
}

export const MultimediaStep = ({ form, t }: MultimediaStepProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [mode, setMode] = useState<'upload' | 'renovator'>('upload');

    // Renovator State
    const [isGenerating, setIsGenerating] = useState(false);
    const [renovatorImage, setRenovatorImage] = useState<string | null>(null);
    const [generatedResult, setGeneratedResult] = useState<{ generatedUrl: string, originalUrl: string, style: string, roomType: string } | null>(null);
    const [roomType, setRoomType] = useState('Salón');
    const [style, setStyle] = useState('Moderno');
    const [requirements, setRequirements] = useState('');
    const [viewingComparison, setViewingComparison] = useState(false);

    // Standard Upload Logic
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const newFiles = Array.from(e.target.files);

            // In a real app, upload here to Firebase and get URLs. 
            // For now we use object URLs for preview.
            // But for the Renovator we need real URLs or Base64.
            const newUrls = newFiles.map(file => URL.createObjectURL(file));

            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const currentFiles = form.getValues('files') || [];
            form.setValue('files', [...currentFiles, ...newUrls]);
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const removeFile = (index: number) => {
        const currentFiles = form.getValues('files') || [];
        form.setValue('files', currentFiles.filter((_, i) => i !== index));
    };

    // Renovator Logic
    const handleRenovatorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setRenovatorImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!renovatorImage) return;
        setIsGenerating(true);
        try {
            // Get Context from Form
            const kitchenArea = form.getValues('kitchen.floorM2');
            const totalArea = form.getValues('totalAreaM2');
            const contextDimensions = kitchenArea ? `Area dimensions: ${kitchenArea}m2` : (totalArea ? `Area approx ${totalArea}m2` : '');

            const promptContext = `${requirements}. ${contextDimensions}`;

            const base64Data = renovatorImage.split(',')[1];

            const result = await generateRenovationAction({
                imageBuffers: [base64Data],
                roomType,
                style,
                additionalRequirements: promptContext,
                budgetId: 'public_draft'
            });

            if (!result.success || !result.base64) {
                // Handle Error
                alert("Error generando imagen: " + result.error);
                return;
            }

            // Upload to Storage (Client Side)
            const { getSafeStorage } = await import('@/lib/firebase/client');
            const storage = getSafeStorage();
            const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
            const timestamp = Date.now();

            const originalRef = ref(storage, `public_drafts/${timestamp}_original.jpg`);
            await uploadString(originalRef, renovatorImage, 'data_url');
            const originalUrl = await getDownloadURL(originalRef);

            const generatedRef = ref(storage, `public_drafts/${timestamp}_${style}.png`);
            await uploadString(generatedRef, result.base64, 'base64', { contentType: 'image/png' });
            const generatedUrl = await getDownloadURL(generatedRef);

            // Save to Form (Visualizations)
            const currentVis = form.getValues('visualizations') || [];
            form.setValue('visualizations', [...currentVis, {
                originalUrl,
                generatedUrl,
                style,
                roomType,
                prompt: promptContext
            }]);

            // Also add original to standard files list for the budget
            const currentFiles = form.getValues('files') || [];
            form.setValue('files', [...currentFiles, originalUrl]);

            setGeneratedResult({ generatedUrl: generatedUrl, originalUrl, style, roomType });

        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const files = form.watch('files') || [];
    const visualizations = form.watch('visualizations') || [];

    return (
        <div className="space-y-6 text-left">
            <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit">
                <Button
                    type="button"
                    variant={mode === 'upload' ? 'default' : 'ghost'}
                    onClick={() => setMode('upload')}
                    size="sm"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Fotos
                </Button>
                <Button
                    type="button"
                    variant={mode === 'renovator' ? 'default' : 'ghost'}
                    onClick={() => setMode('renovator')}
                    className={mode === 'renovator' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'}
                    size="sm"
                >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Visualiza tu Reforma (IA)
                </Button>
            </div>

            {mode === 'upload' ? (
                // STANDARD UPLOAD MODE
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="flex items-center gap-2 font-semibold text-blue-900">
                            <ImageIcon className="w-5 h-5" />
                            Fotos del Estado Actual
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Sube fotos de las estancias a reformar.
                        </p>
                    </div>

                    <FormField
                        control={form.control}
                        name="files"
                        render={() => (
                            <FormItem>
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
                                    </div>
                                </FormControl>
                                <FormMessage />

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
                            </FormItem>
                        )}
                    />
                </div>
            ) : (
                // RENOVATOR MODE
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Photo Tips Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                        <h3 className="flex items-center gap-2 font-semibold text-amber-900 mb-3">
                            <Lightbulb className="w-5 h-5" />
                            Consejos para un resultado perfecto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-amber-800">
                            <div className="flex gap-2 items-start">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Toma la foto desde una <strong>esquina</strong> para captar toda la estancia.</p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Asegúrate de que haya <strong>buena iluminación</strong> (abre persianas).</p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Evita fotos borrosas o demasiado oscuras.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Config Column */}
                        <div className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors relative min-h-[200px]">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleRenovatorUpload}
                                />
                                {renovatorImage ? (
                                    <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                        <img src={renovatorImage} alt="Preview" className="object-cover w-full h-full" />
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-slate-400 mb-2" />
                                        <span className="text-slate-600 font-medium">Sube tu foto aquí</span>
                                        <span className="text-xs text-slate-400">JPG, PNG (Máx 5MB)</span>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Estancia</Label>
                                    <Select value={roomType} onValueChange={setRoomType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Salón">Salón</SelectItem>
                                            <SelectItem value="Cocina">Cocina</SelectItem>
                                            <SelectItem value="Baño">Baño</SelectItem>
                                            <SelectItem value="Dormitorio">Dormitorio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estilo Deseado</Label>
                                    <Select value={style} onValueChange={setStyle}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Moderno">Moderno</SelectItem>
                                            <SelectItem value="Rústico">Rústico</SelectItem>
                                            <SelectItem value="Industrial">Industrial</SelectItem>
                                            <SelectItem value="Escandinavo">Escandinavo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={handleGenerate}
                                disabled={!renovatorImage || isGenerating}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transformando...</>
                                ) : (
                                    <><Wand2 className="mr-2 h-4 w-4" /> Generar Propuesta</>
                                )}
                            </Button>
                        </div>

                        {/* Result Column */}
                        <div className="space-y-4">
                            <Label>Resultado</Label>
                            <div className="w-full aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center border overflow-hidden relative">
                                {generatedResult ? (
                                    <>
                                        <img src={generatedResult.generatedUrl} className="w-full h-full object-cover" alt="Result" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button type="button" variant="secondary" onClick={() => setViewingComparison(true)}>
                                                Ver Comparativa
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-slate-400 p-8">
                                        <Wand2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>Tu transformación aparecerá aquí</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Visualizations List */}
                    {visualizations.length > 0 && (
                        <div className="pt-6 border-t">
                            <h4 className="font-medium mb-3">Tus Propuestas Generadas</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {visualizations.map((vis, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-md overflow-hidden border cursor-pointer hover:ring-2 ring-purple-500"
                                        onClick={() => {
                                            setGeneratedResult(vis);
                                            setViewingComparison(true);
                                        }}
                                    >
                                        <img src={vis.generatedUrl} alt="Gen" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                                            {vis.style}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comparison Modal */}
                    <Dialog open={viewingComparison} onOpenChange={setViewingComparison}>
                        <DialogContent className="max-w-6xl w-[90vw] h-[85vh] p-0 bg-black/95 border-slate-800 flex flex-col">
                            <DialogHeader className="absolute top-0 w-full z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                                <DialogTitle className="text-white">
                                    {generatedResult?.style} - {generatedResult?.roomType}
                                </DialogTitle>
                            </DialogHeader>
                            {generatedResult && (
                                <div className="relative flex-1 w-full h-full overflow-hidden">
                                    <ImageComparisonSlider
                                        beforeImage={generatedResult.originalUrl}
                                        afterImage={generatedResult.generatedUrl}
                                        className="w-full h-full"
                                    />
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
};
