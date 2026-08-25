import { apiUrl } from "../../lib/api";

export function GoogleLoginButton() {
  return (
    <a
      href={`${apiUrl}/api/auth/google`}
      className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
    >
      Continue with Google
    </a>
  );
}
