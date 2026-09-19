import { Suspense } from "react";
import { isGoogleLoginConfigured, isAppleLoginConfigured } from "@/server/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const [googleEnabled, appleEnabled] = await Promise.all([
    Promise.resolve(isGoogleLoginConfigured()),
    isAppleLoginConfigured(),
  ]);

  return (
    <Suspense>
      <LoginForm googleEnabled={googleEnabled} appleEnabled={appleEnabled} />
    </Suspense>
  );
}
