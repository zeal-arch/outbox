import { redirect } from "next/navigation";

export default function HomePage() {
  // Automatically redirect root to the login page.
  redirect("/auth/login");
}
