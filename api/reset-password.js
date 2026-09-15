import twilio from 'twilio';
import { admin } from '../lib/server.js';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error('SMS password reset is not configured yet.');
  }

  return {
    client: twilio(accountSid, authToken),
    serviceSid,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    const {
      companyId,
      username,
      code,
      newPassword,
    } = req.body || {};

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters.',
      });
    }

    const profile = await admin
      .from('profiles')
      .select('*')
      .eq(
        'company_id',
        String(companyId || '').trim().toUpperCase()
      )
      .eq(
        'username_normalized',
        String(username || '').trim().toLowerCase()
      )
      .maybeSingle();

    if (!profile.data?.phone) {
      return res.status(400).json({
        error: 'Verification could not be completed.',
      });
    }

    const { client, serviceSid } = getTwilioClient();

const verification = await client.verify.v2
  .services(serviceSid)
  .verificationChecks.create({
        to: profile.data.phone,
        code: String(code || '').trim(),
      });

    if (verification.status !== 'approved') {
      return res.status(400).json({
        error: 'Verification code is incorrect.',
      });
    }

    const update = await admin.auth.admin.updateUserById(
      profile.data.user_id,
      {
        password: newPassword,
      }
    );

    if (update.error) {
      throw update.error;
    }

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Password reset failed.',
    });
  }
}