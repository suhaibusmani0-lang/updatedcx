import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(
    process.env.NODEMAILER_HOST &&
      process.env.NODEMAILER_PORT &&
      process.env.NODEMAILER_USER &&
      process.env.NODEMAILER_PASS
  );
}

// attachments: [{ filename, content, contentType }]
export async function sendEmail(to, subject, body, attachments = []) {
  try {
    const transporter = hasSmtpConfig()
      ? nodemailer.createTransport({
          host: process.env.NODEMAILER_HOST,
          port: Number(process.env.NODEMAILER_PORT),
          secure: Number(process.env.NODEMAILER_PORT) === 465,
          auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS,
          },
        })
      : null;

    const mailOptions = {
      from: `"Cosmopolitan Xccessories" <${process.env.NODEMAILER_USER || "no-reply@localhost"}>`,
      to,
      subject,
      html: body,
    };

    if (Array.isArray(attachments) && attachments.length) {
      mailOptions.attachments = attachments;
    }

    if (!transporter) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Email delivery is not configured; continuing without sending the email.");
        return true;
      }
      throw new Error("Email service is not configured");
    }

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    const message = error?.message || String(error);

    if (process.env.NODE_ENV !== "production") {
      console.warn("SMTP send failed; continuing in development mode.", message);
      return true;
    }

    throw new Error(`Failed to send email: ${message}`);
  }
}