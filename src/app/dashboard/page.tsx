import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    if (session.user.role === "admin") {
        redirect("/admin/dashboard");
    } else {
        redirect("/user/dashboard");
    }
}
