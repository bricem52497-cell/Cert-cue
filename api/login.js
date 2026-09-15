import {
    admin,
    publicAuth,
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
        companyId,
        username,
        password,
        role,
        managementId,
      } = req.body || {};
  
      const normalizedCompanyId =
        String(companyId || '')
          .trim()
          .toUpperCase();
  
      const normalizedUsername =
        String(username || '')
          .trim()
          .toLowerCase();
  
      const companyResult = await admin
        .from('companies')
        .select('*')
        .eq('id', normalizedCompanyId)
        .maybeSingle();
  
      if (!companyResult.data) {
        return res.status(401).json({
          error: 'Invalid login information.',
        });
      }
  
      if (
        role === 'manager' &&
        companyResult.data.management_id !==
          String(managementId || '')
            .trim()
            .toUpperCase()
      ) {
        return res.status(401).json({
          error: 'Invalid management information.',
        });
      }
  
      const profileResult = await admin
        .from('profiles')
        .select('*')
        .eq('company_id', normalizedCompanyId)
        .eq(
          'username_normalized',
          normalizedUsername
        )
        .eq('role', role)
        .maybeSingle();
  
      if (!profileResult.data) {
        return res.status(401).json({
          error: 'Invalid login information.',
        });
      }
  
      const login =
        await publicAuth.auth.signInWithPassword({
          email: profileResult.data.auth_email,
          password,
        });
  
      if (login.error || !login.data.session) {
        return res.status(401).json({
          error: 'Username or password is incorrect.',
        });
      }
  
      return res.status(200).json({
        profile: mapProfile(profileResult.data),
        session: login.data.session,
      });
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        error: 'Login failed.',
      });
    }
  }