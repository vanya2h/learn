import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useForm } from "react-hook-form";
import { Link, redirect, useLoaderData, useNavigate } from "react-router";
import { z } from "zod";
import { AuthLayout } from "../../src/components/AuthLayout";
import { authClient } from "../../src/lib/authClient";
import { safeRedirectPath } from "../../src/lib/redirect";
import { getAuthLinks, getProfileRoute } from "../../src/lib/routes";
import { auth } from "../../src/server/auth";
import type { Route } from "./+types/sign-up";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Sign Up — Learning Tracker" },
    { name: "description", content: "Create your Learning Tracker account." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = safeRedirectPath(url.searchParams.get("redirect"));
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect(redirectTo);
  return { redirectTo };
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignUp() {
  const { redirectTo } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useLingui();

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
      setError("root", { message: error.message ?? t`Failed to create account` });
    } else {
      navigate(getProfileRoute());
    }
  };

  const signInHref = getAuthLinks().signInWithRedirect(redirectTo);

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground">
          <Trans>Learning Tracker</Trans>
        </h1>
        <p className="mt-2 text-muted-foreground">
          <Trans>Create your account</Trans>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {errors.root && (
          <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2">
            {errors.root.message}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            <Trans>Name</Trans>
          </label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            size="lg"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder={t`Ivan K.`}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            <Trans>Email</Trans>
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            size="lg"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder={t`you@example.com`}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            <Trans>Password</Trans>
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            size="lg"
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            placeholder="••••••••"
          />
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button size="lg" type="submit" variant="default" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Trans>Creating account…</Trans> : <Trans>Create account</Trans>}
        </Button>
      </form>

      <p className="text-center text-muted-foreground">
        <Trans>
          Already have an account?{" "}
          <Link to={signInHref} className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </Trans>
      </p>
    </AuthLayout>
  );
}
