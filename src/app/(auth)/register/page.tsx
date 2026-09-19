import { isGoogleLoginConfigured, isAppleLoginConfigured } from "@/server/auth";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const [googleEnabled, appleEnabled] = await Promise.all([
    Promise.resolve(isGoogleLoginConfigured()),
    isAppleLoginConfigured(),
  ]);

  return <RegisterForm googleEnabled={googleEnabled} appleEnabled={appleEnabled} />;
}
