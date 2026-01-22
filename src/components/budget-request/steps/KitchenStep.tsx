import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/ui/radio-card';
import { ChefHat, Hammer, Droplets, Grid3X3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KitchenStepProps {
  form: UseFormReturn<DetailedFormValues>;
  t: any;
}

export const KitchenStep = ({ form, t }: KitchenStepProps) => {
  const commonT = t.budgetRequest.form;

  // We assume this component is only rendered if Kitchen is selected (handled by Wizard logic)
  // To avoid "closed state", we remove the Accordion and just show the form content directly
  // or use a Card that is always visible.

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 text-left">

      <div className='flex items-center gap-3 mb-4'>
        <div className='bg-orange-100 p-3 rounded-full text-orange-600'>
          <ChefHat className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-headline">Reforma de Cocina</h3>
          <p className="text-muted-foreground text-sm">Define los acabados y trabajos necesarios</p>
        </div>
      </div>

      <Card className="p-6">
        <CardContent className="space-y-6 p-0">
          {/* QUALITY */}
          <FormField
            control={form.control}
            name="kitchen.quality"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="font-semibold">{commonT.quality.label}</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RadioCard value="basic" label="Básica" description="Funcional y económica." className="p-3" />
                    <RadioCard value="medium" label="Media" description="Equilibrio calidad/precio." className="p-3 border-primary/40 bg-primary/5" />
                    <RadioCard value="premium" label="Premium" description="Acabados de lujo." className="p-3" />
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* DEMOLITION & PLUMBING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="kitchen.demolition"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-muted-foreground" />
                    <FormLabel className="font-medium cursor-pointer">{commonT.kitchen.kitchenDemolition.label}</FormLabel>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kitchen.plumbing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <FormLabel className="font-medium cursor-pointer">{commonT.kitchen.kitchenPlumbing.label}</FormLabel>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* SURFACES */}
          <div className="grid grid-cols-2 gap-6 border-t pt-4">
            <FormField
              control={form.control}
              name="kitchen.wallTilesM2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Grid3X3 className="w-4 h-4" /> Paredes (m²)</FormLabel>
                  <FormControl><Input type="number" placeholder="25" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kitchen.floorM2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Grid3X3 className="w-4 h-4" /> Suelo (m²)</FormLabel>
                  <FormControl><Input type="number" placeholder="12" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
