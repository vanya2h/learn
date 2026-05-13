import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useForm } from "react-hook-form";
import { Link, redirect, useLoaderData, useNavigate } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/sign-in";

import { AuthLayout } from "~/components/AuthLayout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/authClient";
import { safeRedirectPath } from "~/lib/redirect";
import { getAuthLinks } from "~/lib/routes";
import { auth } from "~/server/auth";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Sign In — Sheafu" }, { name: "description", content: "Sign in to your Sheafu account." }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = safeRedirectPath(url.searchParams.get("redirect"));
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect(redirectTo);
  return { redirectTo };
}

const schema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function SignIn() {
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
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError("root", { message: error.message ?? t`Invalid email or password` });
    } else {
      navigate(redirectTo);
    }
  };

  const signUpHref = getAuthLinks().signUpWithRedirect(redirectTo);

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground">
          <Trans>Sheafu</Trans>
        </h1>
        <p className="mt-2 text-muted-foreground">
          <Trans>Sign in to your account</Trans>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {errors.root && (
          <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2">
            {errors.root.message}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            <Trans>Email</Trans>
          </label>
          <Input
            id="email"
            type="email"
            size="lg"
            autoComplete="email"
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
            size="lg"
            autoComplete="current-password"
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
          {isSubmitting ? <Trans>Signing in…</Trans> : <Trans>Sign in</Trans>}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Trans>
          No account?{" "}
          <Link to={signUpHref} className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </Trans>
      </p>
    </AuthLayout>
  );
}
