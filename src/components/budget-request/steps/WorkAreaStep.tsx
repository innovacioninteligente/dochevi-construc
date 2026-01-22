import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Users } from 'lucide-react';

interface WorkAreaStepProps {
  form: UseFormReturn<DetailedFormValues>;
  t: any;
}

export const WorkAreaStep = ({ form, t }: WorkAreaStepProps) => {
  const commonT = t.budgetRequest.form.workArea;

  return (
    <div className="space-y-6 text-left animate-in fade-in-50 duration-500">
      <h3 className="text-lg font-semibold text-center mb-4">Detalles del Espacio de Trabajo</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Monitor className="w-6 h-6" />
            </div>
            <FormField
              control={form.control}
              name="workstations"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-base">{commonT.workstations.label}</FormLabel>
                  <FormControl><Input type="number" placeholder="10" className="text-center text-lg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <FormField
              control={form.control}
              name="meetingRooms"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-base">{commonT.meetingRooms.label}</FormLabel>
                  <FormControl><Input type="number" placeholder="2" className="text-center text-lg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
