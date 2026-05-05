# Form Stack: React Hook Form + Zod

Use this stack for all forms — contact, auth, checkout, settings, etc.

**Packages:**
- `react-hook-form` — form state, minimal re-renders
- `zod` — schema-first validation
- `@hookform/resolvers` — connects RHF to Zod

```bash
npm install react-hook-form @hookform/resolvers zod
```

**Pattern:**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormValues) => { /* ... */ };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}
      <input type="password" {...register("password")} />
      {errors.password && <span>{errors.password.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

Rules:
- Derive `FormValues` from the schema with `z.infer` — never write a parallel type
- Always pass `zodResolver(schema)` to `useForm` — no manual validation logic
- Read errors from `formState.errors`, not from external state
