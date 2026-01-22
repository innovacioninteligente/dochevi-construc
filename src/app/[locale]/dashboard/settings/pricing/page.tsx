'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import { use, useEffect } from 'react';

const formSchema = z.object({
  integral_basic: z.coerce.number().positive(),
  integral_medium: z.coerce.number().positive(),
  integral_premium: z.coerce.number().positive(),
  bathrooms_basic: z.coerce.number().positive(),
  bathrooms_medium: z.coerce.number().positive(),
  bathrooms_premium: z.coerce.number().positive(),
  kitchen_basic: z.coerce.number().positive(),
  kitchen_medium: z.coerce.number().positive(),
  kitchen_premium: z.coerce.number().positive(),
});

type FormValues = z.infer<typeof formSchema>;

// Mock initial data
const initialPricingConfig = {
  integral: { basic: 400, medium: 600, premium: 800 },
  bathrooms: { basic: 1100, medium: 1250, premium: 1750 },
  kitchen: { basic: 621, medium: 700, premium: 760 },
};

export default function PricingSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    getDictionary(locale as any).then(d => setT(d.pricingSettings));
  }, [locale]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      integral_basic: initialPricingConfig.integral.basic,
      integral_medium: initialPricingConfig.integral.medium,
      integral_premium: initialPricingConfig.integral.premium,
      bathrooms_basic: initialPricingConfig.bathrooms.basic,
      bathrooms_medium: initialPricingConfig.bathrooms.medium,
      bathrooms_premium: initialPricingConfig.bathrooms.premium,
      kitchen_basic: initialPricingConfig.kitchen.basic,
      kitchen_medium: initialPricingConfig.kitchen.medium,
      kitchen_premium: initialPricingConfig.kitchen.premium,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    console.log("Saving new pricing configuration:", values);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: t.toast.success.title,
        description: t.toast.success.description,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t.toast.error.title,
        description: t.toast.error.description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!t) return null;

  const renderCategoryFields = (category: 'integral' | 'bathrooms' | 'kitchen') => (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">{t[category].title}</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name={`${category}_basic`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.levels.basic}</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${category}_medium`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.levels.medium}</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${category}_premium`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.levels.premium}</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {renderCategoryFields('integral')}
              {renderCategoryFields('bathrooms')}
              {renderCategoryFields('kitchen')}

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t.buttons.loading : t.buttons.save}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
