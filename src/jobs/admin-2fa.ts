/**
 * CLI: generate an admin 2FA secret + otpauth URL. Set the printed secret as
 * ADMIN_TOTP_SECRET, add the otpauth URL to an authenticator app (scan as QR).
 */
import { generateSecret, otpauthUrl } from "@/lib/totp";

const secret = generateSecret();
console.log("ADMIN_TOTP_SECRET=" + secret);
console.log("\nAdd to your authenticator (paste as otpauth / make a QR):");
console.log(otpauthUrl(secret));
