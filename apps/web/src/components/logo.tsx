import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  alt?: string;
};

export default function Logo({ className, alt = "Orca Memory logo" }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img src="/images/logo-light.png" alt={alt} className="logo-light h-full w-auto" />
      <img src="/images/logo-dark.png" alt={alt} className="logo-dark h-full w-auto" />
    </span>
  );
}
