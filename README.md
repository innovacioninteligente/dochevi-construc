# Next.js & Firebase Construction Boilerplate

Este es un proyecto boilerplate diseñado para empresas de construcción, contratistas y servicios del sector. Creado con Next.js, Firebase y ShadCN UI, proporciona una base sólida, moderna y personalizable para lanzar un sitio web profesional rápidamente.

## Características

- **Stack Tecnológico Moderno**: Next.js (App Router), React, TypeScript y Tailwind CSS.
- **Componentes de UI Profesionales**: Integración con [ShadCN UI](https://ui.shadcn.com/) para una interfaz de usuario elegante y personalizable.
- **Backend con Firebase**: Configurado para usar Firebase Authentication y Firestore, permitiendo la creación de áreas de cliente, gestión de presupuestos y más.
- **Formulario de Presupuesto**: Incluye un formulario de presupuesto rápido y funcional que envía los datos por correo.
- **Internacionalización (i18n)**: Estructura preparada para múltiples idiomas con `next-i18n-router`.
- **Blog y Servicios**: Secciones pre-construidas para mostrar tus servicios y publicar contenido de marketing.
- **Diseño Responsivo**: Totalmente adaptado para una visualización perfecta en dispositivos móviles y de escritorio.

## Cómo Empezar

1.  **Clonar el repositorio**:
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Firebase**:
    - Crea un proyecto en [Firebase](https://firebase.google.com/).
    - Habilita **Authentication** (con el proveedor de Email/Contraseña) y **Firestore**.
    - Ve a la configuración de tu proyecto y registra una nueva aplicación web.
    - Copia las credenciales de Firebase y añádelas a tu archivo `.env` o a las variables de entorno de tu hosting:
      ```
      NEXT_PUBLIC_FIREBASE_API_KEY=...
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
      NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
      NEXT_PUBLIC_FIREBASE_APP_ID=...
      ```

4.  **Personalización**:
    - **Nombre y Textos**: Busca "Nombre de empresa" en el proyecto y reemplázalo por el nombre real de tu compañía. Adapta los textos en los archivos de `src/locales/` para que coincidan con tu marca.
    - **Logo**: El logo se encuentra en `src/components/logo.tsx`. Puedes reemplazar el icono `Building` por tu propio logo en formato SVG o imagen.
    - **Estilos**: Modifica los colores y estilos en `src/app/globals.css` y `tailwind.config.ts` para adaptar el diseño a tu identidad de marca.

5.  **Ejecutar en desarrollo**:
    ```bash
    npm run dev
    ```

Abre [http://localhost:9002](http://localhost:9002) en tu navegador para ver el resultado.
