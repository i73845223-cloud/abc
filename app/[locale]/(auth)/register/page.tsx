import { RegisterForm } from "@/components/auth/register-form";
import { cookies } from "next/headers";

interface RegisterPageProps {
  searchParams: { ref?: string; callbackUrl?: string };
}

const RegisterPage = ({ searchParams }: RegisterPageProps) => {
  const cookieStore = cookies();
  const cookieRef = cookieStore.get("affiliate_ref")?.value;
  const refCode = searchParams.ref || cookieRef || null;

  return <RegisterForm refCode={refCode} callbackUrl={searchParams.callbackUrl} />;
};

export default RegisterPage;