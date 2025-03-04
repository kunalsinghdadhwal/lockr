import { resend } from "@/lib/resend";
import VerificationEmail from "../../emails/VerificationEmail";
import { ApiResponse } from "@/types/ApiResponse";
import ResetPasswordEmail from "../../emails/ResetPasswordEmail";

export async function sendEmail(
  email: string,
  username: string,
  token: string,
  subject: string,
  category: string
): Promise<ApiResponse> {
  try {
    if (category == "verify") {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: subject,
        react: VerificationEmail({
          username,
          token,
          callback_url: "/email-verified",
        }),
      });
    } else if (category == "reset") {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: subject,
        react: ResetPasswordEmail({
          username,
          token,
        }),
      });
    }
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
