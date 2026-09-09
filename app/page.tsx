import { redirect } from "next/navigation";

/** The lab has no marketing homepage — land straight on the index. */
export default function Home() {
  redirect("/demos");
}
