import { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/ui/radio-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bath, Pipette } from 'lucide-react';

interface BathroomStepProps {
    form: UseFormReturn<DetailedFormValues>;
    bathroomFields: FieldArrayWithId<DetailedFormValues, "bathrooms", "id">[];
    t: any;
}

export const BathroomStep = ({ form, bathroomFields, t }: BathroomStepProps) => {
    const commonT = t.budgetRequest.form;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 text-left">
            {bathroomFields.map((field, index) => (
                <Card key={field.id} className="overflow-hidden border-2 border-muted/50">
                    <CardHeader className="bg-muted/10 pb-4 border-b">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Bath className="w-5 h-5" />
                            </div>
                            Baño {index + 1}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* QUALITY */}
                        <FormField
                            control={form.control}
                            name={`bathrooms.${index}.quality`}
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Calidad de Acabados</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-3">
                                            <RadioCard value="basic" label="Básica" className="p-2 text-sm text-center justify-center" />
                                            <RadioCard value="medium" label="Media" className="p-2 text-sm text-center justify-center border-primary/40 bg-primary/5" />
                                            <RadioCard value="premium" label="Premium" className="p-2 text-sm text-center justify-center" />
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* SURFACES */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={`bathrooms.${index}.wallTilesM2`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Paredes (m²)</FormLabel>
                                        <FormControl><Input type="number" placeholder="25" {...field} value={field.value || ''} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`bathrooms.${index}.floorM2`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Suelo (m²)</FormLabel>
                                        <FormControl><Input type="number" placeholder="6" {...field} value={field.value || ''} /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* EXTRAS */}
                        <div className="space-y-3 pt-2">
                            <FormField
                                control={form.control}
                                name={`bathrooms.${index}.plumbing`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20">
                                        <div className='flex items-center gap-2'>
                                            <Pipette className='w-4 h-4 text-blue-500' />
                                            <FormLabel className="font-medium cursor-pointer">Renovar Fontanería Completa</FormLabel>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name={`bathrooms.${index}.installShowerTray`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <FormLabel className="font-medium text-sm cursor-pointer">Instalar Plato Ducha</FormLabel>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`bathrooms.${index}.installShowerScreen`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <FormLabel className="font-medium text-sm cursor-pointer">Instalar Mampara</FormLabel>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
