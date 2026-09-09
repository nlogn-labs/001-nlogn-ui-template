import { DemoShell } from "@/components/DemoShell";
import { AceternityDemo } from "@/components/demos/AceternityDemo";
import { parseTakeParams, type DemoSearchParams } from "@/lib/take/params";

export const metadata = { title: "NLOGN — Ridgeline" };

export default async function AceternityPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const { takeMode, loopMode, fit } = parseTakeParams(await searchParams);
  return (
    <DemoShell takeMode={takeMode} loopMode={loopMode} fit={fit}>
      <AceternityDemo />
    </DemoShell>
  );
}
