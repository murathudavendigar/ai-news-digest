import { ImageResponse } from 'next/og';
import { getColumnistAccent } from '@/app/lib/columnistConfig';
import { supabaseAdmin } from "@/app/lib/supabase";

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { columnistSlug } = await params;

  const { data: columnist } = await supabaseAdmin
    .from('columnists')
    .select('name, title')
    .eq('slug', columnistSlug)
    .single();

  if (!columnist) {
    return new ImageResponse(<div style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a' }} />);
  }

  const accent = getColumnistAccent(columnistSlug);

  const caveatFont = await fetch(
    'https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjcB9eIWpZQ.woff2'
  ).then(r => r.arrayBuffer());

  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        padding: '0',
      }}>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: accent.primary,
          display: 'flex',
        }} />

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 80px',
        }}>
          {/* Badge */}
          <div style={{
            backgroundColor: accent.primary,
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '600',
            padding: '8px 24px',
            borderRadius: '6px',
            letterSpacing: '1px',
            marginBottom: '40px',
          }}>
            HaberAI KÖŞE YAZARI
          </div>
          
          {/* Name in Signature Font */}
          <span style={{
            color: accent.primary,
            fontSize: '96px',
            fontFamily: 'Caveat',
            fontWeight: '600',
            marginBottom: '16px',
          }}>
            {columnist.name}
          </span>
          
          {/* Title */}
          <span style={{
            color: '#9ca3af',
            fontSize: '32px',
          }}>
            {columnist.title}
          </span>
        </div>

        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: accent.primary,
          display: 'flex',
        }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Caveat', data: caveatFont, weight: 600, style: 'normal' },
      ],
    }
  );
}
