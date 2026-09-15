import { supabase } from './supabase';

export async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You are not signed in.');
  }

  const headers = new Headers(options.headers);

  headers.set(
    'Authorization',
    `Bearer ${session.access_token}`
  );

  headers.set(
    'Content-Type',
    'application/json'
  );

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'Request failed.'
    );
  }

  return data;
}