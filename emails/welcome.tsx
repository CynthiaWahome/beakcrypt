import {
  Head,
  Body,
  Html,
  Text,
  Link,
  Button,
  Preview,
  Heading,
  Section,
  Tailwind,
  Container,
  pixelBasedPreset,
} from "@react-email/components";

interface WelcomeEmailProps {
  email: string;
}

const siteUrl = process.env.SITE_URL ?? "";
export const WelcomeEmail = ({ email }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Preview>Welcome to Beakcrypt</Preview>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="mx-auto bg-white rounded-3xl max-w-150 px-12 py-12">
            <Section className="text-center">
              <Heading className="mx-0 my-7.5 p-0 text-center font-normal text-[24px] text-black">
                Welcome to <strong>Beakcrypt</strong>
              </Heading>
            </Section>

            <Section className="mb-8">
              <Text className="text-[18px] text-black mb-6 leading-6 font-medium">
                Hi {email},
              </Text>

              <Text className="text-[16px] text-gray-600 mb-6 leading-6">
                Welcome to Beakcrypt! We&apos;re excited to have you on board.
                You can now securely manage your environment variables and sync
                secrets across your team.
              </Text>

              <Text className="text-[16px] text-gray-600 mb-8 leading-6">
                Click the button below to get started.
              </Text>

              <div className="text-center mb-8">
                <Button
                  href={siteUrl}
                  className="bg-[#5eead4] text-black px-8 py-4 rounded-md text-[16px] font-medium no-underline box-border inline-block"
                >
                  Go to Dashboard
                </Button>
              </div>

              <Text className="text-[14px] text-gray-600 leading-5 mb-4">
                If you have any questions or need assistance, our support team
                is here to help. Kindly reply to this email or visit our{" "}
                <Link href={siteUrl} className="text-black">
                  help center
                </Link>
                .
              </Text>
            </Section>

            <div className="border-t border-gray-100 mb-8"></div>

            <Section>
              <Text className="text-[12px] text-gray-400 text-center leading-4 mt-4 m-0">
                <Link href={siteUrl} className="text-gray-400">
                  Beakcrypt
                </Link>
                {" • "}© 2026 All rights reserved
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  email: "user@acme.com",
} as WelcomeEmailProps;
