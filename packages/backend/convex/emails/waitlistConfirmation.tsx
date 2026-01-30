import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const WaitlistConfirmationEmail = () => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-black font-sans py-[40px]">
          <Container className="bg-[#090909] rounded-[8px] p-[32px] max-w-[600px] mx-auto border border-gray-800">
            <Section className="text-center mb-[32px]">
              <Img
                src="https://di867tnz6fwga.cloudfront.net/brand-kits/3c944035-7983-47ec-af14-a67d15ad8b13/primary/0f2cc255-cd58-454d-9709-c1f776ed8278.png"
                alt="Orca Memory"
                className="w-full h-auto object-cover max-w-[200px] mx-auto"
              />
            </Section>

            <Section className="text-center mb-[32px]">
              <Heading className="text-[32px] font-bold text-white m-0 mb-[16px]">
                Welcome to the Future of AI Memory
              </Heading>
              <Text className="text-[18px] text-gray-300 m-0">
                You're now part of something revolutionary
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-300 leading-[24px] m-0 mb-[16px]">
                Thank you for joining the Orca Memory waitlist. You've taken the first step
                toward transforming how OpenClaw agents remember, learn, and evolve.
              </Text>

              <Text className="text-[16px] text-gray-300 leading-[24px] m-0 mb-[24px]">
                Here's what awaits you:
              </Text>

              <Section className="bg-black rounded-[8px] p-[24px] mb-[24px] border border-gray-800">
                <Text className="text-[16px] text-gray-300 leading-[24px] m-0 mb-[12px]">
                  <span className="text-[#29d4ff] font-semibold">🧠 Persistent Memory:</span>{" "}
                  Your agents will remember across sessions, building intelligence over time
                </Text>
                <Text className="text-[16px] text-gray-300 leading-[24px] m-0 mb-[12px]">
                  <span className="text-[#29d4ff] font-semibold">🔍 Semantic Search:</span>{" "}
                  Find relevant memories instantly with advanced AI-powered search
                </Text>
                <Text className="text-[16px] text-gray-300 leading-[24px] m-0">
                  <span className="text-[#29d4ff] font-semibold">⚡ Early Access:</span> Be among
                  the first to experience the future of AI memory infrastructure
                </Text>
              </Section>

              <Text className="text-[16px] text-gray-300 leading-[24px] m-0 mb-[24px]">
                We're building more than just a platform – we're creating the foundation for
                truly intelligent AI agents. Your early support fuels this vision, and we can't
                wait to show you what's possible when memory becomes limitless.
              </Text>

              <Section className="text-center mb-[24px]">
                <Button
                  href="https://orcamemory.com"
                  className="bg-[#29d4ff] text-black px-[24px] py-[12px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-[#1fc4ef]"
                >
                  Explore Orca Memory
                </Button>
              </Section>

              <Text className="text-[16px] text-gray-300 leading-[24px] m-0 text-center">
                Stay connected and follow our journey as we revolutionize AI memory:
              </Text>

              <Section className="text-center mt-[16px] mb-[24px]">
                <Link href="https://x.com/orcamemoryai" className="inline-block mx-[8px]">
                  <Img
                    src="https://new.email/static/emails/social/social-x.png"
                    alt="Follow us on X"
                    className="w-[32px] h-[32px]"
                  />
                </Link>
                <Link
                  href="https://github.com/Nebaura-Labs/orcamemory"
                  className="inline-block mx-[8px]"
                >
                  <Img
                    src="https://new.email/static/emails/social/social-github.png"
                    alt="Star us on GitHub"
                    className="w-[32px] h-[32px]"
                  />
                </Link>
              </Section>
            </Section>

            <Hr className="border-gray-800 my-[32px]" />

            <Section className="text-center">
              <Text className="text-[14px] text-gray-400 leading-[20px] m-0 mb-[8px]">
                Persistent memory for OpenClaw agents.
              </Text>
              <Text className="text-[14px] text-gray-400 leading-[20px] m-0 mb-[16px]">
                Questions? Reply to this email – we'd love to hear your thoughts on the future
                of AI memory.
              </Text>
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
                <Link href="#" className="text-gray-500 underline">
                  Unsubscribe
                </Link>{" "}
                | © 2026 Nebaura Labs - All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WaitlistConfirmationEmail;
