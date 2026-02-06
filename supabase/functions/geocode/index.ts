import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GeocodeRequest {
  address: string;
  city?: string;
  state?: string;
}

interface GeocodeResponse {
  lat: number;
  lng: number;
  formatted_address: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY is not configured');
      throw new Error('Google Maps API key not configured');
    }

    const { address, city, state }: GeocodeRequest = await req.json();
    
    if (!address) {
      throw new Error('Address is required');
    }

    // Build full address string
    const fullAddress = [address, city, state].filter(Boolean).join(', ');
    console.log('Geocoding address:', fullAddress);

    // Call Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    console.log('Geocode API response status:', data.status);

    if (data.status === 'ZERO_RESULTS') {
      return new Response(
        JSON.stringify({ error: 'No results found for the address', status: 'ZERO_RESULTS' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.status !== 'OK') {
      console.error('Geocoding API error:', data.status, data.error_message);
      throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    const geocodeResult: GeocodeResponse = {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
    };

    console.log('Geocode successful:', geocodeResult);

    return new Response(
      JSON.stringify(geocodeResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in geocode function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
