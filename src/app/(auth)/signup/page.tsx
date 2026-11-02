import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Create a workspace" };
export default async function Signup() { if (await currentUser()) redirect("/dashboard"); return <AuthForm mode="signup" />; }
