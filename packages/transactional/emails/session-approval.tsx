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

interface SessionApprovalEmailProps {
  orgName: string;
  approveLink: string;
}

const siteUrl = process.env.SITE_URL ?? "";

export const SessionApprovalEmail = ({
  orgName,
  approveLink,
}: SessionApprovalEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Preview>
          New device signed in to {orgName} — approve encryption key
        </Preview>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="mx-auto bg-white rounded-3xl max-w-150 px-12 py-12">
            <Section className="text-center">
              <Heading className="mx-0 my-7.5 p-0 text-center font-normal text-[24px] text-black">
                New device needs approval
              </Heading>
            </Section>

            <Section className="mb-10">
              <Text className="text-[16px] text-gray-600 mb-6 leading-6">
                A <strong className="text-black">new device</strong> has signed
                in to your <strong className="text-black">{orgName}</strong>{" "}
                organization and needs its encryption key approved before it can
                access shared secrets.
              </Text>

              <Text className="text-[16px] text-gray-600 mb-8 leading-6">
                If this was you, click the button below from an already
                authenticated device to approve the new session. This will open
                Beakcrypt in your browser and automatically handle the
                encryption process.
              </Text>

              <div className="text-center mb-8">
                <Button
                  href={approveLink}
                  className="bg-[#5eead4] text-black px-8 py-4 rounded-md text-[16px] font-medium no-underline box-border inline-block"
                >
                  Approve Session
                </Button>
              </div>

              <Text className="text-[14px] text-gray-500 text-center leading-5">
                Can&apos;t see the button? Copy and paste this link into your
                browser:
              </Text>
              <Text className="text-center mb-8">
                <Link
                  href={approveLink}
                  className="text-black text-[14px] underline break-all"
                >
                  {approveLink}
                </Link>
              </Text>

              <Text className="text-[14px] text-gray-500 text-center leading-5">
                If you did not sign in on a new device, you should revoke this
                session immediately from your Sessions page.
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

SessionApprovalEmail.PreviewProps = {
  orgName: "Acme Corp",
  approveLink: "https://beakcrypt.com/acme/sessions?approveSession=abc123",
} as SessionApprovalEmailProps;
