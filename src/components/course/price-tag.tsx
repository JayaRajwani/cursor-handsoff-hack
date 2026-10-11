import { formatPkr, formatUsdApprox } from "@/config/payment";
import { cn } from "@/lib/utils";

export function PriceTag({ price, className, size = "md" }: { price: { pkr: number; usd?: number }; className?: string; size?: "md" | "lg" }) {
  const usd = formatUsdApprox(price.pkr, price.usd);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold text-primary", size === "lg" ? "font-serif text-3xl" : "text-lg")}>{formatPkr(price.pkr)}</span>
      {usd ? <span className="text-sm text-muted-foreground">{usd}</span> : null}
    </p>
  );
}
