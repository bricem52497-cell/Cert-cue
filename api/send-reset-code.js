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
    const companyId = String(
      req.body?.companyId || ''
    )
      .trim()
      .toUpperCase();

    const username = String(
      req.body?.username || ''
    )
      .trim()
      .toLowerCase();

    const profile = await admin
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .eq('username_normalized', username)
      .maybeSingle();

    if (!profile.data?.phone) {
      return res.status(200).json({
        ok: true,
      });
    }

    const { client, serviceSid } = getTwilioClient();

await client.verify.v2
  .services(serviceSid)
      .verifications.create({
        to: profile.data.phone,
        channel: 'sms',
      });

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Unable to send verification code.',
    });
  }
}