import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

export const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export const publicAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export function makeCode(prefix) {
  return `${prefix}-${randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;
}

export function normalizePhone(raw) {
  const value = String(raw || '').trim();
  const digits = value.replace(/\D/g, '');

  if (value.startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  throw new Error('Enter a valid phone number.');
}

export async function requireProfile(req) {
  const header = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = header.substring(7);

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } =
    await admin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

  if (profileError || !profile) {
    throw new Error('Profile not found.');
  }

  return profile;
}

export function mapProfile(profile) {
  return {
    id: profile.user_id,
    companyId: profile.company_id,
    role: profile.role,
    name: profile.name,
    username: profile.username,
    phone: profile.phone,
    jobTitle: profile.job_title || '',
    locationId: profile.location_id || '',
    employmentStatus:
      profile.employment_status || 'Active',
  };
}

export function mapLocation(location) {
  return {
    id: location.id,
    companyId: location.company_id,
    name: location.name,
    address: location.address || '',
    managerName: location.manager_name || '',
    phone: location.phone || '',
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMeters: location.radius_meters,
    status: location.active ? 'Active' : 'Inactive',
  };
}

export function mapTimeEntry(entry) {
  return {
    id: entry.id,
    companyId: entry.company_id,
    userId: entry.user_id,
    locationId: entry.location_id,
    clockIn: entry.clock_in,
    clockOut: entry.clock_out || undefined,
    clockInLatitude: entry.clock_in_latitude,
    clockInLongitude: entry.clock_in_longitude,
    clockOutLatitude:
      entry.clock_out_latitude ?? undefined,
    clockOutLongitude:
      entry.clock_out_longitude ?? undefined,
  };
}

export function distanceMeters(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const earthRadius = 6371000;
  const rad = (value) => (value * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}