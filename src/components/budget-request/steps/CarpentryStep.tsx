import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/ui/radio-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Wand2, Layers, DoorOpen, PaintRoller, Frame } from 'lucide-react';

interface CarpentryStepProps {
  form: UseFormReturn<DetailedFormValues>;
  t: any;
}

export const CarpentryStep = ({ form, t }: CarpentryStepProps) => {
  const commonT = t.budgetRequest.form;

  // Watchers
  const watchPaintWalls = form.watch('paintWalls');
  const watchPaintCeilings = form.watch('paintCeilings');
  const watchInteriorDoors = form.watch('renovateInteriorDoors');
  const watchSlidingDoors = form.watch('installSlidingDoor');
  const watchExteriorCarpentry = form.watch('renovateExteriorCarpentry');
  const watchRemoveGotele = form.watch('removeGotele');
  const totalArea = Number(form.watch('totalAreaM2')) || 0;
  const numRooms = Number(form.watch('numberOfRooms')) || 0;
  const numBathrooms = Number(form.watch('numberOfBathrooms')) || 0;

  const labels = {
    flooring: "Suelos y Rodapiés",
    floorType: "Tipo de Suelo Nuevo",
    skirting: "Metros lineales de Rodapié",
    carpentry: "Carpintería Interior",
    doorsMaterial: "Acabado de Puertas",
    exterior: "Carpintería Exterior (Ventanas)",
    painting: "Pintura y Paredes",
    paintType: "Tipo de Pintura",
  };

  // Magic Fill Functions
  const autoFillSkirting = () => {
    // Basic heuristic: Total area * 0.9 roughly approximates perimeter minus door gaps
    const value = Math.round(totalArea * 0.9);
    form.setValue('skirtingBoardLinearMeters', value);
  };

  const autoFillDoors = () => {
    // Heuristic: 1 per room + 1 per bath + 1 kitchen + 1 living room
    const value = numRooms + numBathrooms + 2;
    form.setValue('interiorDoorsAmount', value);
  };

  const autoFillCeilings = () => {
    // Usually ceiling area = floor area
    form.setValue('paintCeilingsM2', totalArea);
  };

  const autoFillWalls = () => {
    // Heuristic: Walls area is roughly 3x floor area (very rough)
    form.setValue('paintWallsM2', totalArea * 3);
    form.setValue('removeGoteleM2', totalArea * 3);
  };


  return (
    <div className="space-y-8 text-left animate-in fade-in-50 duration-500">

      {/* 1. FLOORING */}
      <Card>
        <CardHeader><CardTitle className='text-lg flex items-center gap-2'><Layers className="text-primary" /> {labels.flooring}</CardTitle></CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <FormField
            control={form.control}
            name="floorType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className='font-semibold'>{labels.floorType}</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 gap-3">
                    <RadioCard value="parquet" label="Parquet / Tarima" description="Cálido y elegante." className='p-3' />
                    <RadioCard value="tile" label="Gres / Porcelánico" description="Resistente y duradero." className='p-3' />
                    <RadioCard value="microcement" label="Microcemento" description="Moderno y continuo." className='p-3' />
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skirtingBoardLinearMeters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labels.skirting}</FormLabel>
                <div className="flex gap-2 items-end">
                  <FormControl><Input type="number" placeholder="Ej: 75" {...field} value={field.value || ''} /></FormControl>
                  <Button type="button" variant="outline" size="icon" onClick={autoFillSkirting} title="Calcular automáticamente">
                    <Wand2 className="w-4 h-4 text-purple-500" />
                  </Button>
                </div>
                <FormMessage />
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-purple-600 font-medium">Tip:</span> Pulsando la varita mágica calculamos un aproximado basado en los {totalArea}m² de tu vivienda.
                </p>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* 2. DOORS */}
      <Card>
        <CardHeader><CardTitle className='text-lg flex items-center gap-2'><DoorOpen className="text-primary" /> {labels.carpentry}</CardTitle></CardHeader>
        <CardContent className='space-y-6'>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name="renovateInteriorDoors"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm font-medium">Cambiar Puertas de Paso</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              {watchInteriorDoors && (
                <FormField
                  control={form.control}
                  name="interiorDoorsAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <div className="flex gap-2">
                        <FormControl><Input type="number" placeholder="Cantidad" {...field} value={field.value || ''} /></FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={autoFillDoors} title="Sugerir cantidad">
                          <Wand2 className="w-4 h-4 text-purple-500" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name="installSlidingDoor"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm font-medium">Instalar Puertas Correderas</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              {watchSlidingDoors && (
                <FormField
                  control={form.control}
                  name="slidingDoorAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl><Input type="number" placeholder="Cantidad" {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {(watchInteriorDoors || watchSlidingDoors) && (
            <FormField
              control={form.control}
              name="doorsMaterial"
              render={({ field }) => (
                <FormItem className="space-y-3 pt-4 border-t animate-in slide-in-from-top-2">
                  <FormLabel className="font-semibold">{labels.doorsMaterial}</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RadioCard value="lacquered" label="Lacadas Blancas" description="Luminosas y atemporales." />
                      <RadioCard value="wood" label="Madera Natural / Roble" description="Calidez clásica." />
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* 3. EXTERIOR */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <FormField
              control={form.control}
              name="renovateExteriorCarpentry"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Frame className="w-5 h-5 text-muted-foreground" />
                    <FormLabel className="text-sm font-medium">{labels.exterior}</FormLabel>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            {watchExteriorCarpentry && (
              <FormField
                control={form.control}
                name="externalWindowsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de Ventanas</FormLabel>
                    <FormControl><Input type="number" placeholder="5" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. PAINTING & WALLS */}
      <Card>
        <CardHeader><CardTitle className='text-lg flex items-center gap-2'><PaintRoller className="text-primary" /> {labels.painting}</CardTitle></CardHeader>
        <CardContent className='space-y-6'>
          {/* GOTELE */}
          <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg">
            <FormField
              control={form.control}
              name="removeGotele"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-row items-center justify-between">
                  <FormLabel className="text-base font-medium cursor-pointer">Alisar Paredes (Quitar Gotelé)</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            {watchRemoveGotele && (
              <FormField
                control={form.control}
                name="removeGoteleM2"
                render={({ field }) => (
                  <FormItem className="w-40 animate-in fade-in slide-in-from-left-2">
                    <FormLabel>m² Pared</FormLabel>
                    <div className="flex gap-1">
                      <FormControl><Input type="number" placeholder="100" {...field} value={field.value || ''} /></FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={autoFillWalls}><Wand2 className="w-3 h-3 text-purple-500" /></Button>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>

          <Separator />

          {/* PINTURA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PAREDES */}
            <div className='space-y-3'>
              <FormField
                control={form.control}
                name="paintWalls"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm font-medium">Pintar Paredes</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              {watchPaintWalls && (
                <FormField
                  control={form.control}
                  name="paintWallsM2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>m² Paredes</FormLabel>
                      <div className="flex gap-1">
                        <FormControl><Input type="number" placeholder="m²" {...field} value={field.value || ''} /></FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={autoFillWalls}><Wand2 className="w-3 h-3 text-purple-500" /></Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* TECHOS */}
            <div className='space-y-3'>
              <FormField
                control={form.control}
                name="paintCeilings"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm font-medium">Pintar Techos</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              {watchPaintCeilings && (
                <FormField
                  control={form.control}
                  name="paintCeilingsM2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>m² Techos</FormLabel>
                      <div className="flex gap-1">
                        <FormControl><Input type="number" placeholder="m²" {...field} value={field.value || ''} /></FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={autoFillCeilings}><Wand2 className="w-3 h-3 text-purple-500" /></Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {(watchPaintWalls || watchPaintCeilings) && (
            <FormField
              control={form.control}
              name="paintType"
              render={({ field }) => (
                <FormItem className="space-y-3 bg-muted/10 p-4 rounded-xl border-dashed border-2 animate-in slide-in-from-top-2">
                  <FormLabel className="font-semibold">{labels.paintType}</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RadioCard value="white" label="Blanco" description="Opción económica y limpia." />
                      <RadioCard value="color" label="Color" description="Personalización premium." />
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        </CardContent>
      </Card>

    </div>
  );
};
