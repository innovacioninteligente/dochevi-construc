import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutTemplate, Volume2 } from 'lucide-react';

interface CeilingsStepProps {
  form: UseFormReturn<DetailedFormValues>;
  t: any;
}

export const CeilingsStep = ({ form, t }: CeilingsStepProps) => {
  const watchInstallFalseCeiling = form.watch('installFalseCeiling');
  const watchSoundproofRoom = form.watch('soundproofRoom');
  const commonT = t.budgetRequest.form;

  return (
    <div className="space-y-6 text-left animate-in fade-in-50 duration-500">

      {/* Falso Techo */}
      <Card>
        <CardContent className="pt-6">
          <FormField
            control={form.control}
            name="installFalseCeiling"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-full"><LayoutTemplate className="w-5 h-5 text-gray-600" /></div>
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold block">{commonT.ceilings.installFalseCeiling.label}</FormLabel>
                    <p className="text-sm text-muted-foreground">Ocultar instalaciones o nivelar superficie.</p>
                  </div>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          {watchInstallFalseCeiling && (
            <div className="mt-4 pl-12">
              <FormField
                control={form.control}
                name="falseCeilingM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{commonT.ceilings.falseCeilingM2.label}</FormLabel>
                    <div className="flex gap-2 items-center">
                      <FormControl><Input type="number" placeholder="20" className="w-32" {...field} value={field.value || ''} /></FormControl>
                      <span>m²</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insonorización */}
      <Card>
        <CardContent className="pt-6">
          <FormField
            control={form.control}
            name="soundproofRoom"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full"><Volume2 className="w-5 h-5 text-indigo-600" /></div>
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold block">{commonT.ceilings.soundproofRoom.label}</FormLabel>
                    <p className="text-sm text-muted-foreground">Aislamiento acústico de paredes o techos.</p>
                  </div>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          {watchSoundproofRoom && (
            <div className="mt-4 pl-12">
              <FormField
                control={form.control}
                name="soundproofRoomM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{commonT.ceilings.soundproofRoomM2.label}</FormLabel>
                    <div className="flex gap-2 items-center">
                      <FormControl><Input type="number" placeholder="15" className="w-32" {...field} value={field.value || ''} /></FormControl>
                      <span>m²</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
