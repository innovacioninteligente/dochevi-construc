import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/ui/radio-card';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Home, Briefcase, Ruler, DoorOpen, Bath, ChefHat, Hammer, Lightbulb, Grid } from 'lucide-react';

interface ProjectDefinitionStepProps {
  form: UseFormReturn<DetailedFormValues>;
  t: any;
}

const partialScopeOptions = [
  { id: 'bathroom', label: 'Reforma de Baño(s)', icon: Bath },
  { id: 'kitchen', label: 'Reforma de Cocina', icon: ChefHat },
  { id: 'demolition', label: 'Demoliciones', icon: Hammer },
  { id: 'ceilings', label: 'Falsos Techos', icon: Grid },
  { id: 'electricity', label: 'Electricidad', icon: Lightbulb },
  { id: 'carpentry', label: 'Carpintería y Pintura', icon: DoorOpen },
];

export const ProjectDefinitionStep = ({ form, t }: ProjectDefinitionStepProps) => {
  const commonT = t.budgetRequest.form.projectDefinition;
  const watchPropertyType = form.watch('propertyType');
  const watchProjectScope = form.watch('projectScope');

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 text-left">

      {/* 1. PROPERTY TYPE */}
      <FormField
        control={form.control}
        name="propertyType"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className='text-base font-semibold'>{commonT.propertyType.label}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <RadioCard value="residential" label={commonT.propertyType.residential} icon={<Home className="w-5 h-5" />} />
                <RadioCard value="commercial" label={commonT.propertyType.commercial} icon={<Building className="w-5 h-5" />} />
                <RadioCard value="office" label={commonT.propertyType.office} icon={<Briefcase className="w-5 h-5" />} />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 2. PROJECT SCOPE */}
      <FormField
        control={form.control}
        name="projectScope"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className='text-base font-semibold'>{commonT.projectScope.label}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <RadioCard
                  value="integral"
                  label={commonT.projectScope.integral}
                  description="Reforma completa de toda la propiedad."
                  className='border-primary/50'
                />
                <RadioCard
                  value="partial"
                  label={commonT.projectScope.partial}
                  description="Solo ciertas estancias o partidas."
                />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 2.1 PARTIAL SCOPE SELECTOR */}
      {watchProjectScope === 'partial' && (
        <Card className='p-6 border-dashed border-2 bg-muted/20 animate-in slide-in-from-top-4'>
          <FormField
            control={form.control}
            name="partialScope"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base font-semibold">{commonT.partialScope.label}</FormLabel>
                  <FormDescription>{commonT.partialScope.description}</FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {partialScopeOptions.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="partialScope"
                      render={({ field }) => {
                        const isChecked = field.value?.includes(item.id);
                        return (
                          <FormItem key={item.id} className="space-y-0">
                            <FormControl>
                              <Checkbox
                                className='sr-only'
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(field.value?.filter((value) => value !== item.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className={cn(
                              "flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all hover:border-primary/50",
                              isChecked ? "border-primary bg-primary/5 text-primary" : "border-muted bg-popover"
                            )}>
                              <item.icon className={cn("w-5 h-5", isChecked ? "text-primary" : "text-muted-foreground")} />
                              <span className="font-medium">{item.label}</span>
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>
      )}

      {/* 3. DIMENSIONS */}
      <FormField
        control={form.control}
        name="totalAreaM2"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2 text-base font-semibold'><Ruler className="w-4 h-4 text-primary" /> {commonT.totalAreaM2.label}</FormLabel>
            <div className="flex gap-2 items-center">
              <FormControl><Input type="number" placeholder="90" className='text-lg' {...field} value={field.value || ''} /></FormControl>
              <span className="text-muted-foreground font-medium">m²</span>
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      {watchPropertyType === 'residential' && (
        <div className='grid grid-cols-2 gap-6'>
          <FormField
            control={form.control}
            name="numberOfRooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-base'>{commonT.numberOfRooms.label}</FormLabel>
                <FormControl><Input type="number" placeholder="3" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfBathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-base'>{commonT.numberOfBathrooms.label}</FormLabel>
                <FormControl><Input type="number" placeholder="2" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};
