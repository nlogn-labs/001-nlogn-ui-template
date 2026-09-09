import { DemoShell } from "@/components/DemoShell";
import { ReactBitsPortfolioDemo } from "@/components/demos/ReactBitsPortfolioDemo";
import { parseTakeParams, type DemoSearchParams } from "@/lib/take/params";

export const metadata = { title: "NLOGN — Portfolio" };

export default async function ReactBitsPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const { takeMode, loopMode, fit } = parseTakeParams(await searchParams);
  return (
    <DemoShell takeMode={takeMode} loopMode={loopMode} fit={fit}>
      <ReactBitsPortfolioDemo />
    </DemoShell>
  );
}
