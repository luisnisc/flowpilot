import ResetPasswordForm from "@/app/components/ResetPasswordForm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) redirect("/forgot-password");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Suspense fallback={<div>Cargando...</div>}>
        <ResetPasswordForm token={token} />
      </Suspense>
    </div>
  );
}
