import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, redirect, useNavigate } from "react-router";
import { z } from "zod";
import { authClient } from "../../src/lib/authClient";
import { auth } from "../../src/server/auth";
import type { Route } from "./+types/sign-up";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/");
  return {};
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignUp() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError("root", { message: error.message ?? "Failed to create account" });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">ML Learning</h1>
          <p className="mt-2 text-sm text-neutral-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm text-neutral-300">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              placeholder="Ivan K."
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-xs text-red-400 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-xs text-red-400 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              placeholder="••••••••"
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-red-400 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-neutral-300 hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
