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

interface VerificationEmailProps {
  username: string;
  otp: string;
  text: string;
  buttontext: string;
  callback_url: string;
  verify: boolean
}

export default function VerificationEmail({
  username,
  otp,
  text,
  buttontext,
  callback_url,
  verify
}: VerificationEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Verification Code</title>
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
      <Preview>Here&apos;s your verification code: {otp}</Preview>
      <Section>
        <Row>
          <Heading as="h2">Hello {username},</Heading>
        </Row>
        <Row>
          <Text>
            {text}
          </Text>
        </Row>
        <Row style={{ textAlign: "center", margin: "20px 0" }}>
          {verify ? (
            <Button
              href={`${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${otp}&callbackURL=${callback_url}`}
              style={{
                backgroundColor: "#000000",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "5px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {buttontext}
            </Button>
          ) : (
            <Button
              href={`${process.env.BETTER_AUTH_URL}/api/auth/reset-password/${otp}?callbackURL=${callback_url}`}
              style={{
                backgroundColor: "#000000",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "5px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {buttontext}
            </Button>
          )}
        </Row>
      </Section>
    </Html>
  );
}
