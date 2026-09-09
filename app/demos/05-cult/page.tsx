import { DemoShell } from "@/components/DemoShell";
import { CultDemo } from "@/components/demos/CultDemo";
import { parseTakeParams, type DemoSearchParams } from "@/lib/take/params";

export const metadata = { title: "NLOGN — Liquid" };

export default async function CultPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const { takeMode, loopMode, fit } = parseTakeParams(await searchParams);
  return (
    <DemoShell takeMode={takeMode} loopMode={loopMode} fit={fit}>
      <CultDemo />
    </DemoShell>
  );
}
