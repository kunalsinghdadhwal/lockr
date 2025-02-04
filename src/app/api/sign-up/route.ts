import { db } from "@/db/drizzle";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { users } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    const existingUserVerifiedByUsername = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.isVerified, true)));

    if (existingUserVerifiedByUsername) {
      return Response.json(
        {
          success: false,
          message: "Username already exists",
        },
        {
          status: 400,
        }
      );
    }

    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const verifyCode = crypto.randomInt(100000, 1000000);

    if (existingUserByEmail) {
      if (existingUserByEmail[0].isVerified) {
        return Response.json(
          {
            success: false,
            message: "User already exists with this Email",
          },
          {
            status: 400,
          }
        );
      } else {
        const hashedpassword = await bcrypt.hash(password, 10);
        existingUserByEmail[0].password = hashedpassword;
        existingUserByEmail[0].verifyCode = verifyCode.toString();
        existingUserByEmail[0].verifyCodeExpires = new Date(
          Date.now() + 3600000
        );

        await db
          .update(users)
          .set(existingUserByEmail[0])
          .where(eq(users.email, email));
      }
    } else {
      const hashedpassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const saveUser = await db.insert(users).values({
        username: username,
        email: email,
        password: hashedpassword,
        verifyCode: verifyCode.toString(),
        verifyCodeExpires: expiryDate,
      });

      const emailResponse = await sendVerificationEmail(
        email,
        username,
        verifyCode.toString()
      );

      if (!emailResponse.success) {
        return Response.json(
          {
            success: false,
            message: emailResponse.message,
          },
          { status: 500 }
        );
      }
      return Response.json(
        {
          success: true,
          message: "User registered successfully, Please verify your email",
        },
        {
          status: 201,
        }
      );
    }
  } catch (error) {
    console.error("Error registering user", error);
    return Response.json(
      {
        success: false,
        message: "Error registering user",
      },
      {
        status: 500,
      }
    );
  }
}
