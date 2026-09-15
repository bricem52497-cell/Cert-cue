import {
    admin,
    requireProfile,
  } from '../lib/server.js';
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }
  
    try {
      const manager = await requireProfile(req);
  
      if (manager.role !== 'manager') {
        return res.status(403).json({
          error: 'Management access required.',
        });
      }
  
      const { userId, locationId } = req.body || {};
  
      const employee = await admin
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', manager.company_id)
        .single();
  
      if (employee.error) {
        return res.status(404).json({
          error: 'Employee not found.',
        });
      }
  
      const location = await admin
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .eq('company_id', manager.company_id)
        .single();
  
      if (location.error) {
        return res.status(404).json({
          error: 'Location not found.',
        });
      }
  
      const update = await admin
        .from('profiles')
        .update({
          location_id: locationId,
        })
        .eq('user_id', userId);
  
      if (update.error) throw update.error;
  
      return res.status(200).json({
        ok: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Could not assign location.',
      });
    }
  }