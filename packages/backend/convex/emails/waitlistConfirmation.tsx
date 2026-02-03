import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

const OrcaMemoryBetaLaunch = () => {
	return (
		<Html dir="ltr" lang="en">
			<Tailwind>
				<Head />
				<Body className="bg-[#000000] py-[40px] font-sans">
					<Container className="mx-auto max-w-[600px] px-[40px]">
						{/* Header with Logo */}
						<Section className="mb-[32px] text-center">
							<Img
								alt="Orca Memory"
								className="mx-auto h-auto w-full max-w-[200px]"
								src="https://di867tnz6fwga.cloudfront.net/brand-kits/3c944035-7983-47ec-af14-a67d15ad8b13/primary/0f2cc255-cd58-454d-9709-c1f776ed8278.png"
							/>
						</Section>

						{/* Main Content */}
						<Section className="mb-[32px]">
							<Heading className="mb-[24px] text-center font-bold text-[#ffffff] text-[28px] leading-[1.2]">
								🎉 Beta is Live!
							</Heading>

							<Text className="mb-[20px] text-[#ffffff] text-[16px] leading-[1.6]">
								We moved fast, and it's finally here. Your beta access to Orca
								Memory is ready.
							</Text>

							<Text className="mb-[20px] text-[#ffffff] text-[16px] leading-[1.6]">
								You joined our waitlist believing in the vision of persistent
								memory for AI agents. Today, that vision becomes reality. It's
								time to give your OpenClaw agents the memory infrastructure they
								deserve.
							</Text>

							<Text className="mb-[32px] text-[#ffffff] text-[16px] leading-[1.6]">
								<strong>What you get today:</strong>
							</Text>

							<Text className="mb-[16px] ml-[20px] text-[#ffffff] text-[16px] leading-[1.6]">
								• <strong>Persistent Memory:</strong> Your agents remember
								across every session
							</Text>
							<Text className="mb-[16px] ml-[20px] text-[#ffffff] text-[16px] leading-[1.6]">
								• <strong>Semantic Search:</strong> Find the right memories
								instantly
							</Text>
							<Text className="mb-[32px] ml-[20px] text-[#ffffff] text-[16px] leading-[1.6]">
								• <strong>Context Continuity:</strong> Conversations that build
								on themselves
							</Text>
						</Section>

						{/* CTA Button */}
						<Section className="mb-[40px] text-center">
							<Button
								className="box-border inline-block rounded-[8px] bg-[#29d4ff] px-[32px] py-[16px] font-semibold text-[16px] text-black no-underline"
								href="https://app.orcamemory.com"
							>
								Start Building with Memory
							</Button>
						</Section>

						<Hr className="my-[32px] border-[#333333] border-solid" />

						{/* Beta Community Section */}
						<Section className="mb-[32px]">
							<Text className="mb-[20px] text-[#ffffff] text-[16px] leading-[1.6]">
								This is beta, which means you're part of something special. Your
								feedback shapes the future of AI agent memory infrastructure.
								Every insight you share helps us build something extraordinary.
							</Text>

							<Text className="mb-[24px] text-[#ffffff] text-[16px] leading-[1.6]">
								Join our Discord community to connect with other beta users,
								share your experiences, and help us perfect the platform. Get
								your exclusive{" "}
								<strong className="text-[#29d4ff]">@Beta Tester</strong> role
								and be part of the conversation.
							</Text>

							<Section className="mb-[20px] text-center">
								<Button
									className="box-border inline-block rounded-[8px] bg-[#5865F2] px-[24px] py-[12px] font-semibold text-[14px] text-white no-underline"
									href="https://discord.gg/DptEDf3n"
								>
									Join Discord Community
								</Button>
							</Section>

							<Text className="text-[#ffffff] text-[16px] leading-[1.6]">
								Ready to transform how your agents remember? Let's build the
								future together.
							</Text>
						</Section>

						<Hr className="my-[32px] border-[#333333] border-solid" />

						{/* Footer */}
						<Section>
							<Text className="mb-[16px] text-center text-[#888888] text-[14px]">
								Persistent memory for OpenClaw agents.
							</Text>

							{/* Social Links */}
							<Row className="mb-[20px] text-center">
								<Column className="text-center">
									<Link className="mx-[8px]" href="https://x.com/orcamemoryai">
										<Img
											alt="X (Twitter)"
											className="inline-block"
											height="24"
											src="https://new.email/static/emails/social/social-x.png"
											width="24"
										/>
									</Link>
									<Link
										className="mx-[8px]"
										href="https://github.com/Nebaura-Labs/orcamemory"
									>
										<Img
											alt="GitHub"
											className="inline-block"
											height="24"
											src="https://new.email/static/emails/social/social-github.png"
											width="24"
										/>
									</Link>
								</Column>
							</Row>

							<Text className="m-0 mb-[8px] text-center text-[#666666] text-[12px]">
								© 2026 Nebaura Labs
							</Text>

							<Text className="m-0 text-center text-[#666666] text-[12px]">
								<Link
									className="text-[#29d4ff] no-underline"
									href="https://orcamemory.com"
								>
									orcamemory.com
								</Link>
								{" • "}
								<Link className="text-[#29d4ff] no-underline" href="#">
									Unsubscribe
								</Link>
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default OrcaMemoryBetaLaunch;
