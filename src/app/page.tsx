import { redirect } from "next/navigation";

const currentYear = new Date().getFullYear();

export default function Home() {
  redirect(`/year/${currentYear}`);
}
