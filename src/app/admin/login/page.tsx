import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/?role=admin");
}
