'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { landingPath } from '@/lib/landing';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LocaleSwitch } from '@/components/locale-switch';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Login screen (PRD 2. fejezet – Bejelentkezés: e-mail + jelszó). Authenticates
 * against `/api/auth/login` and routes the user to their landing area. Error
 * copy is translated from the safe `messageKey` the API returns; a `401` maps to
 * the "invalid credentials" message so existing accounts are never revealed.
 */
export default function LoginPage() {
  const t = useTranslations();
  const { login, user } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (user) router.replace(landingPath(user.roles));
  }, [user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrorKey(null);
    try {
      await login(email, password);
      // `login` updates the session; the effect above performs the redirect once
      // the store notifies. Redirect eagerly too for immediate feedback.
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorKey(
          error.status === 401 ? 'auth.invalidCredentials' : error.messageKey,
        );
      } else {
        setErrorKey('errors.generic');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const errorMessage =
    errorKey && t.has(errorKey)
      ? t(errorKey)
      : errorKey
        ? t('errors.generic')
        : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-sm items-center justify-between">
        <span className="text-xl font-bold tracking-tight">
          {t('common.appName')}
        </span>
        <div className="flex items-center gap-1">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('auth.signIn')}</CardTitle>
          <CardDescription>{t('common.tagline')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {errorMessage && (
              <p
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {errorMessage}
              </p>
            )}

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
