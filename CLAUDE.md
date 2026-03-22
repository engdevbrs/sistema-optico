# Sistema de Gestión Óptica — Reglas de Desarrollo

## Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS v4
- **Backend/API:** Supabase (Auth, DB, Storage, Realtime, Edge Functions)
- **Jobs:** pg_cron o Trigger.dev
- **Emails:** Resend (desde Edge Functions)
- **WhatsApp:** Twilio (desde Edge Functions)
- **PDF:** jsPDF (desde Edge Functions)

## Estructura del proyecto
```
sistema-optica/
├── frontend/          → React app (Vite)
├── supabase/          → Migraciones, Edge Functions, RLS policies
├── plan-optica.md     → Plan completo del sistema
└── CLAUDE.md          → Este archivo
```

## TypeScript
- Strict mode siempre activado
- NUNCA usar `any` — usar `unknown` si es necesario y refinar con type guards
- Preferir `interface` sobre `type` para objetos
- Todos los props de componentes deben tener interface definida
- Validar inputs externos (API, forms) con Zod siempre

## React
- Solo componentes funcionales con hooks
- Lazy loading en todas las rutas con `React.lazy()` + `Suspense`
- React Query (`@tanstack/react-query`) para todo server state
- No usar `useEffect` para fetch de datos — usar React Query
- Error Boundaries en cada sección principal
- Cada vista debe manejar 3 estados: loading, empty, error
- Componentes reutilizables en `src/components/ui/`
- Páginas en `src/pages/`
- Hooks custom en `src/hooks/`
- Tipos/interfaces en `src/types/`

## Estilos y UX/UI
- **NUNCA usar colores directos** — siempre usar CSS variables (tokens) definidos en `index.css`
- Ejemplo correcto: `bg-[var(--btn-primary-bg)]`
- Ejemplo incorrecto: `bg-blue-600`
- Tipografía: Inter (pesos 400, 500, 600)
- Border radius: 6px inputs/botones, 8px cards, 9999px badges
- Modo claro/oscuro: controlado por clase `.dark` en `:root`
- Mobile-first: diseñar para móvil primero, escalar a desktop
- Accesibilidad: ARIA labels en botones de ícono, roles semánticos, contraste mínimo 4.5:1
- Sombras suaves estilo Stripe
- Feedback visual en toda interacción (hover, focus, active, disabled)

## Supabase
- NUNCA usar `service_role` key desde el frontend
- Siempre usar `anon` key + Row Level Security (RLS)
- RLS policies en TODAS las tablas sin excepción
- Edge Functions para lógica de negocio compleja
- Validar con Zod antes de enviar a Supabase

## Seguridad
- Validar todo input del usuario con Zod (frontend Y Edge Functions)
- Sanitizar datos antes de renderizar (prevenir XSS)
- No exponer datos sensibles en console.log
- Tokens con UUID v4
- Rate limiting en endpoints públicos

## Performance
- React Query con staleTime apropiado (no refetch innecesario)
- Memoización (`useMemo`, `useCallback`) solo cuando hay problema medible
- Imágenes optimizadas con lazy loading nativo
- Code splitting por ruta
- Evitar re-renders innecesarios (React DevTools Profiler)

## Convenciones de código
- Nombres de componentes: PascalCase (`PatientCard.tsx`)
- Nombres de hooks: camelCase con prefijo `use` (`usePatients.ts`)
- Nombres de tipos: PascalCase con sufijo descriptivo (`PatientFormData`)
- Archivos de utilidad: camelCase (`formatDate.ts`)
- Constantes: UPPER_SNAKE_CASE (`MAX_APPOINTMENTS_PER_DAY`)
- Idioma del código: inglés (variables, funciones, componentes)
- Idioma de la UI: español (textos visibles al usuario)

## Git
- Commits en español
- Formato: `tipo: descripción breve`
- Tipos: feat, fix, refactor, style, docs, test, chore
