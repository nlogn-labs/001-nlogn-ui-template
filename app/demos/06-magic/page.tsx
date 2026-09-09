import { DemoShell } from "@/components/DemoShell";
import { MagicDemo } from "@/components/demos/MagicDemo";
import { parseTakeParams, type DemoSearchParams } from "@/lib/take/params";

export const metadata = { title: "NLOGN — Routing" };

export default async function MagicPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const { takeMode, loopMode, fit } = parseTakeParams(await searchParams);
  return (
    <DemoShell takeMode={takeMode} loopMode={loopMode} fit={fit}>
      <MagicDemo />
    </DemoShell>
  );
}
