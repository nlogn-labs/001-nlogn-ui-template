import { DemoShell } from "@/components/DemoShell";
import { KokonutDemo } from "@/components/demos/KokonutDemo";
import { parseTakeParams, type DemoSearchParams } from "@/lib/take/params";

export const metadata = { title: "NLOGN — Release ops" };

export default async function KokonutPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const { takeMode, loopMode, fit } = parseTakeParams(await searchParams);
  return (
    <DemoShell takeMode={takeMode} loopMode={loopMode} fit={fit}>
      <KokonutDemo />
    </DemoShell>
  );
}
