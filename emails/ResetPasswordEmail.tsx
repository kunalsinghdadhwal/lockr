import {
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Row,
  Section,
  Text,
  Button,
} from "@react-email/components";

interface ResetPasswordProps {
  username: string;
  token: string;
}

export default function ResetPasswordEmail({
  username,
  token,
}: ResetPasswordProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Reset Password Link</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Reset Password to get back on</Preview>
      <Section>
        <Row>
          <Heading as="h2">Hello {username},</Heading>
        </Row>
        <Row>
          <Text>Click the below link to verify your identity and Reset your password</Text>
        </Row>
        <Row style={{ textAlign: "center", margin: "20px 0" }}>
          <Button
            href={`${process.env.BETTER_AUTH_URL}/api/auth/reset-password?token=${token}&callbackURL=/reset-password`}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "5px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
           Reset Password
          </Button>
        </Row>
      </Section>
    </Html>
  );
}
