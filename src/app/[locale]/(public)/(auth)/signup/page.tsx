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
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getSafeAuth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDictionary } from '@/lib/dictionaries';

const formSchema = z
  .object({
    email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export default function SignupPage({ params: { locale } }: { params: { locale: any }}) {
  const { toast } = useToast();
  const router = useRouter();
  const [dict, setDict] = useState<any>(null);

  useEffect(() => {
    getDictionary(locale).then(d => setDict(d.signup));
  }, [locale]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const auth = getSafeAuth();
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: '¡Cuenta Creada!',
        description: 'Te hemos registrado correctamente.',
      });
      router.push(`/${locale}/dashboard`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description: error.message || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
      });
    }
  }

  if (!dict) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{dict.title}</CardTitle>
        <CardDescription>{dict.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.emailLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.passwordLabel}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.confirmPasswordLabel}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creando cuenta...' : dict.button}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {dict.hasAccount}{' '}
          <Link href="/login" className="underline">
            {dict.loginLink}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
