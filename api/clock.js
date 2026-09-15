import {
    admin,
    requireProfile,
    distanceMeters,
    mapTimeEntry,
  } from '../lib/server.js';
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }
  
    try {
      const profile = await requireProfile(req);
  
      const {
        action,
        locationId,
        latitude,
        longitude,
        accuracy,
      } = req.body || {};
  
      const lat = Number(latitude);
      const lng = Number(longitude);
  
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return res.status(400).json({
          error: 'GPS location is required.',
        });
      }
  
      if (
        Number.isFinite(Number(accuracy)) &&
        Number(accuracy) > 200
      ) {
        return res.status(400).json({
          error:
            'Your GPS accuracy is too low. Move somewhere with a better GPS signal and try again.',
        });
      }
  
      if (action === 'in') {
        if (!locationId) {
          return res.status(400).json({
            error: 'Select a workplace.',
          });
        }
  
        if (
          profile.role === 'employee' &&
          profile.location_id !== locationId
        ) {
          return res.status(403).json({
            error:
              'You can only clock in at your assigned workplace.',
          });
        }
  
        const locationResult = await admin
          .from('locations')
          .select('*')
          .eq('id', locationId)
          .eq('company_id', profile.company_id)
          .eq('active', true)
          .single();
  
        if (locationResult.error) {
          return res.status(404).json({
            error: 'Workplace not found.',
          });
        }
  
        const workplace = locationResult.data;
  
        const distance = distanceMeters(
          lat,
          lng,
          workplace.latitude,
          workplace.longitude
        );
  
        if (distance > workplace.radius_meters) {
          return res.status(403).json({
            error:
              `You are about ${Math.round(distance)} meters away. ` +
              `You must be within ${workplace.radius_meters} meters of ${workplace.name}.`,
          });
        }
  
        const existing = await admin
          .from('time_entries')
          .select('*')
          .eq('user_id', profile.user_id)
          .is('clock_out', null)
          .maybeSingle();
  
        if (existing.data) {
          return res.status(409).json({
            error: 'You are already clocked in.',
          });
        }
  
        const result = await admin
          .from('time_entries')
          .insert({
            company_id: profile.company_id,
            user_id: profile.user_id,
            location_id: workplace.id,
            clock_in_latitude: lat,
            clock_in_longitude: lng,
          })
          .select()
          .single();
  
        if (result.error) throw result.error;
  
        return res.status(200).json({
          message: 'Clocked in successfully.',
          entry: mapTimeEntry(result.data),
        });
      }
  
      if (action === 'out') {
        const openEntry = await admin
          .from('time_entries')
          .select('*')
          .eq('user_id', profile.user_id)
          .is('clock_out', null)
          .maybeSingle();
  
        if (!openEntry.data) {
          return res.status(409).json({
            error: 'You are not clocked in.',
          });
        }
  
        const workplaceResult = await admin
          .from('locations')
          .select('*')
          .eq('id', openEntry.data.location_id)
          .single();
  
        if (workplaceResult.error) {
          return res.status(404).json({
            error: 'Workplace not found.',
          });
        }
  
        const workplace = workplaceResult.data;
  
        const distance = distanceMeters(
          lat,
          lng,
          workplace.latitude,
          workplace.longitude
        );
  
        if (distance > workplace.radius_meters) {
          return res.status(403).json({
            error:
              `You must be within ${workplace.radius_meters} meters of ` +
              `${workplace.name} to clock out.`,
          });
        }
  
        const result = await admin
          .from('time_entries')
          .update({
            clock_out: new Date().toISOString(),
            clock_out_latitude: lat,
            clock_out_longitude: lng,
          })
          .eq('id', openEntry.data.id)
          .select()
          .single();
  
        if (result.error) throw result.error;
  
        return res.status(200).json({
          message: 'Clocked out successfully.',
          entry: mapTimeEntry(result.data),
        });
      }
  
      return res.status(400).json({
        error: 'Invalid clock action.',
      });
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Clock operation failed.',
      });
    }
  }