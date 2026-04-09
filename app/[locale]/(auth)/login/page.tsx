import { LoginForm } from "@/components/auth/login-form";
import { cookies } from "next/headers";

interface LoginPageProps {
  searchParams: { ref?: string; callbackUrl?: string };
}

const LoginPage = ({ searchParams }: LoginPageProps) => {
  const cookieStore = cookies();
  const cookieRef = cookieStore.get("affiliate_ref")?.value;
  const refCode = searchParams.ref || cookieRef || null;

  return <LoginForm refCode={refCode} callbackUrl={searchParams.callbackUrl} />;
};

export default LoginPage;