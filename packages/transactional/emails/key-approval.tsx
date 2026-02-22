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

interface KeyApprovalEmailProps {
  memberEmail: string;
  orgName: string;
  approveLink: string;
}

const siteUrl = process.env.SITE_URL ?? "";

export const KeyApprovalEmail = ({
  memberEmail,
  orgName,
  approveLink,
}: KeyApprovalEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Preview>
          {memberEmail} needs encryption key approval for {orgName}
        </Preview>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="mx-auto bg-white rounded-3xl max-w-150 px-12 py-12">
            <Section className="text-center">
              <Heading className="mx-0 my-7.5 p-0 text-center font-normal text-[24px] text-black">
                Encryption key approval needed
              </Heading>
            </Section>

            <Section className="mb-10">
              <Text className="text-[16px] text-gray-600 mb-6 leading-6">
                <strong className="text-black">{memberEmail}</strong> has joined{" "}
                <strong className="text-black">{orgName}</strong> and needs
                their encryption key approved before they can access shared
                secrets.
              </Text>

              <Text className="text-[16px] text-gray-600 mb-8 leading-6">
                Click the button below to approve their key. This will open
                Beakcrypt in your browser and automatically handle the
                encryption process.
              </Text>

              <div className="text-center mb-8">
                <Button
                  href={approveLink}
                  className="bg-[#5eead4] text-black px-8 py-4 rounded-md text-[16px] font-medium no-underline box-border inline-block"
                >
                  Approve Key
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

KeyApprovalEmail.PreviewProps = {
  memberEmail: "newmember@acme.com",
  orgName: "Acme Corp",
  approveLink: "https://beakcrypt.com/acme/teams?approveKey=abc123",
} as KeyApprovalEmailProps;
