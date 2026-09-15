import { randomUUID } from 'node:crypto';

import {
  admin,
  publicAuth,
  makeCode,
  normalizePhone,
  mapProfile,
} from '../lib/server.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    const {
      mode,
      companyId: suppliedCompanyId,
      companyName,
      name,
      username,
      password,
      phone,
      jobTitle,
    } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({
        error: 'Name is required.',
      });
    }

    if (!username?.trim()) {
      return res.status(400).json({
        error: 'Username is required.',
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters.',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    const normalizedUsername = username.trim().toLowerCase();

    let companyId;
    let managementId;
    let company;

    if (mode === 'manager') {
      if (!companyName?.trim()) {
        return res.status(400).json({
          error: 'Company name is required.',
        });
      }

      companyId = makeCode('CC');
      managementId = makeCode('MGT');

      const result = await admin
        .from('companies')
        .insert({
          id: companyId,
          name: companyName.trim(),
          management_id: managementId,
        })
        .select()
        .single();

      if (result.error) throw result.error;

      company = result.data;
    } else {
      companyId = String(suppliedCompanyId || '')
        .trim()
        .toUpperCase();

      const result = await admin
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (result.error) throw result.error;

      if (!result.data) {
        return res.status(404).json({
          error: 'Company ID not found.',
        });
      }

      company = result.data;
    }

    const duplicate = await admin
      .from('profiles')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('username_normalized', normalizedUsername)
      .maybeSingle();

    if (duplicate.data) {
      return res.status(409).json({
        error: 'That username is already registered.',
      });
    }

    const authEmail =
      `${randomUUID()}@users.certcue.invalid`;

    const created =
      await admin.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
      });

    if (created.error || !created.data.user) {
      throw (
        created.error ||
        new Error('Could not create account.')
      );
    }

    const userId = created.data.user.id;

    const profileResult = await admin
      .from('profiles')
      .insert({
        user_id: userId,
        company_id: companyId,
        role:
          mode === 'manager'
            ? 'manager'
            : 'employee',
        name: name.trim(),
        username: username.trim(),
        username_normalized: normalizedUsername,
        phone: normalizedPhone,
        auth_email: authEmail,
        job_title: jobTitle?.trim() || '',
      })
      .select()
      .single();

    if (profileResult.error) {
      await admin.auth.admin.deleteUser(userId);
      throw profileResult.error;
    }

    const signedIn =
      await publicAuth.auth.signInWithPassword({
        email: authEmail,
        password,
      });

    if (signedIn.error || !signedIn.data.session) {
      throw (
        signedIn.error ||
        new Error('Could not sign in.')
      );
    }

    return res.status(200).json({
      profile: mapProfile(profileResult.data),

      session: signedIn.data.session,

      company: {
        id: company.id,
        name: company.name,
        managementId:
          company.management_id,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Registration failed.',
    });
  }
}