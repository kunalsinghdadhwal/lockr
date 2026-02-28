import {
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface OTPEmailProps {
  otp: string;
  type: "email-verification" | "sign-in" | "forget-password";
}

const headingMap = {
  "email-verification": "Verify your email",
  "sign-in": "Sign-in code",
  "forget-password": "Reset your password",
} as const;

const descriptionMap = {
  "email-verification":
    "Use the code below to verify your email address and complete your registration.",
  "sign-in":
    "Use the code below to sign in to your Lockr account.",
  "forget-password":
    "Use the code below to reset your password.",
} as const;

export default function OTPEmail({ otp, type }: OTPEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>{headingMap[type]}</title>
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
      <Preview>{headingMap[type]} - Your Lockr verification code</Preview>
      <Section>
        <Row>
          <Heading as="h2">{headingMap[type]}</Heading>
        </Row>
        <Row>
          <Text>{descriptionMap[type]}</Text>
        </Row>
        <Row style={{ textAlign: "center", margin: "24px 0" }}>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "0.3em",
              fontFamily: "monospace",
              backgroundColor: "#f4f4f5",
              padding: "12px 24px",
              borderRadius: "8px",
              display: "inline-block",
            }}
          >
            {otp}
          </Text>
        </Row>
        <Row>
          <Text style={{ color: "#71717a", fontSize: "14px" }}>
            This code expires in 10 minutes. If you did not request this code,
            you can safely ignore this email.
          </Text>
        </Row>
      </Section>
    </Html>
  );
}
