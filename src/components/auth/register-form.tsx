"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Turnstile } from "@/components/ui/turnstile";
import { MailCheck } from "lucide-react";

interface RegisterFormProps {
  googleEnabled: boolean;
  appleEnabled: boolean;
}

export function RegisterForm({ googleEnabled, appleEnabled }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, turnstileToken }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (data.needsVerification) {
      setLoading(false);
      setCheckEmail(true);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
  }

  if (checkEmail) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <MailCheck className="h-8 w-8 text-primary" />
          <p className="font-display text-lg font-semibold">Check your email</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            We sent a verification link to <span className="text-foreground">{email}</span>. Click it to
            activate your account, then log in.
          </p>
          <Button asChild className="mt-2">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start hosting karaoke nights in minutes.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {(googleEnabled || appleEnabled) && (
          <div className="flex flex-col gap-2">
            {googleEnabled && (
              <Button variant="outline" type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
                Continue with Google
              </Button>
            )}
            {appleEnabled && (
              <Button variant="outline" type="button" onClick={() => signIn("apple", { callbackUrl: "/dashboard" })}>
                Continue with Apple
              </Button>
            )}
            <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Turnstile onVerify={setTurnstileToken} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
