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

interface InviteUserEmailProps {
  orgName: string;
  userEmail: string;
  inviteLink: string;
  invitedByEmail: string;
}

const siteUrl = process.env.SITE_URL ?? "";

export const InviteUserEmail = ({
  orgName,
  userEmail,
  inviteLink,
  invitedByEmail,
}: InviteUserEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Preview>You&apos;ve been invited to join {orgName} on Beakcrypt</Preview>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="mx-auto bg-white rounded-3xl max-w-150 px-12 py-12">
            <Section className="text-center">
              <Heading className="mx-0 my-7.5 p-0 text-center font-normal text-[24px] text-black">
                Join <strong>{orgName}</strong> on <strong>Beakcrypt</strong>
              </Heading>
            </Section>

            <Section className="mb-10">
              <Text className="text-[18px] text-black mb-6 leading-6 font-medium">
                Hi {userEmail},
              </Text>

              <Text className="text-[16px] text-gray-600 mb-6 leading-6">
                <strong className="text-black">{invitedByEmail}</strong> has
                invited you to join the{" "}
                <strong className="text-black">{orgName}</strong> organization.
                You can now collaborate with your team and securely access
                shared secrets.
              </Text>

              <Text className="text-[16px] text-gray-600 mb-8 leading-6">
                Click the button below to accept your invitation and set up your
                account.
              </Text>

              <div className="text-center mb-8">
                <Button
                  href={inviteLink}
                  className="bg-[#5eead4] text-black px-8 py-4 rounded-md text-[16px] font-medium no-underline box-border inline-block"
                >
                  Accept Invitation
                </Button>
              </div>

              <Text className="text-[14px] text-gray-500 text-center leading-5">
                Can&apos;t see the button? Copy and paste this link into your
                browser:
              </Text>
              <Text className="text-center mb-8">
                <Link
                  href={inviteLink}
                  className="text-black text-[14px] underline break-all"
                >
                  {inviteLink}
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

InviteUserEmail.PreviewProps = {
  orgName: "Acme Corp",
  userEmail: "user@acme.com",
  inviteLink: "https://beakcrypt.com/auth/invite?token=123",
  invitedByEmail: "admin@acme.com",
} as InviteUserEmailProps;

export default InviteUserEmail;
