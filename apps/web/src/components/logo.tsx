import { cn } from "@/lib/utils";

type LogoProps = {
	className?: string;
	alt?: string;
};

export default function Logo({
	className,
	alt = "Orca Memory logo",
}: LogoProps) {
	return (
		<span className={cn("inline-flex items-center", className)}>
			<img
				alt={alt}
				className="logo-light h-full w-auto"
				src="/images/logo-light.png"
			/>
			<img
				alt={alt}
				className="logo-dark h-full w-auto"
				src="/images/logo-dark.png"
			/>
		</span>
	);
}
