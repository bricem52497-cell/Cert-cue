import {
    admin,
    requireProfile,
    mapLocation,
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
  
      const {
        name,
        address,
        managerName,
        phone,
        latitude,
        longitude,
        radiusMeters,
      } = req.body || {};
  
      if (
        !name ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude))
      ) {
        return res.status(400).json({
          error: 'Name and GPS location are required.',
        });
      }
  
      const radius = Number(radiusMeters) || 100;
  
      const result = await admin
        .from('locations')
        .insert({
          company_id: manager.company_id,
          name: String(name).trim(),
          address: String(address || '').trim(),
          manager_name: String(managerName || '').trim(),
          phone: String(phone || '').trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          radius_meters: radius,
        })
        .select()
        .single();
  
      if (result.error) throw result.error;
  
      return res.status(200).json({
        location: mapLocation(result.data),
      });
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Could not create location.',
      });
    }
  }