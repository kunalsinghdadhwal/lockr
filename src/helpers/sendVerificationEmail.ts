import { resend } from "@/lib/resend";
import VerificationEmail from "../../emails/VerificationEmail";
import { ApiResponse } from "@/types/ApiResponse";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string,
  subject: string,
  text: string,
  buttontext: string,
  callback_url: string,
  verify: boolean
): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: subject,
      react: VerificationEmail({
        username,
        otp: verifyCode,
        text,
        buttontext,
        callback_url,
        verify,
      }),
    });
    return {
      success: true,
      message: "email sent",
    };
  } catch (error) {
    console.error("Error sending email: ", error);
    return {
      success: false,
      message: "Failed to send email",
    };
  }
}
