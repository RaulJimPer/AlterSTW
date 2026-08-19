import { Resend } from "resend";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} in .env.local`);
  }
  return value;
}

let resendClient: Resend | undefined;

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(requiredEnv("RESEND_API_KEY"));
  }
  return resendClient;
}