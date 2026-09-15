import {
    admin,
    requireProfile,
    mapProfile,
    mapLocation,
    mapTimeEntry,
  } from '../lib/server.js';
  
  export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }
  
    try {
      const me = await requireProfile(req);
  
      const companyResult = await admin
        .from('companies')
        .select('*')
        .eq('id', me.company_id)
        .single();
  
      const locationsResult = await admin
        .from('locations')
        .select('*')
        .eq('company_id', me.company_id)
        .order('created_at');
  
      let profilesQuery = admin
        .from('profiles')
        .select('*')
        .eq('company_id', me.company_id);
  
      if (me.role !== 'manager') {
        profilesQuery = profilesQuery.eq(
          'user_id',
          me.user_id
        );
      }
  
      const profilesResult = await profilesQuery;
  
      let entriesQuery = admin
        .from('time_entries')
        .select('*')
        .eq('company_id', me.company_id)
        .order('clock_in', {
          ascending: false,
        });
  
      if (me.role !== 'manager') {
        entriesQuery = entriesQuery.eq(
          'user_id',
          me.user_id
        );
      }
  
      const entriesResult = await entriesQuery;
  
      if (
        companyResult.error ||
        locationsResult.error ||
        profilesResult.error ||
        entriesResult.error
      ) {
        throw new Error('Could not load company data.');
      }
  
      return res.status(200).json({
        me: mapProfile(me),
  
        company: {
          id: companyResult.data.id,
          name: companyResult.data.name,
          managementId:
            me.role === 'manager'
              ? companyResult.data.management_id
              : '',
        },
  
        users: profilesResult.data.map(mapProfile),
  
        locations: locationsResult.data.map(mapLocation),
  
        timeEntries: entriesResult.data.map(mapTimeEntry),
      });
    } catch (error) {
      return res.status(401).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unauthorized',
      });
    }
  }