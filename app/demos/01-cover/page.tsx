import { DemoShell } from "@/components/DemoShell";
import { CoverDemo } from "@/components/demos/CoverDemo";
import { parseTakeParams, type DemoSearchParams } from "@/lib/take/params";

export const metadata = { title: "NLOGN — Cover" };

export default async function CoverPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const { takeMode, loopMode, fit } = parseTakeParams(await searchParams);
  return (
    <DemoShell takeMode={takeMode} loopMode={loopMode} fit={fit}>
      <CoverDemo />
    </DemoShell>
  );
}
