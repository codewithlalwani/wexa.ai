import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Log in" };
export default async function Login() { if (await currentUser()) redirect("/dashboard"); return <AuthForm mode="login" />; }
