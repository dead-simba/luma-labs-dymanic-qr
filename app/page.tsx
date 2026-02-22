import { redirect } from "next/navigation";

export default function Home() {
  // By default, the root of the redirect engine points to the main shop
  redirect("https://lumalabs.store");
}
