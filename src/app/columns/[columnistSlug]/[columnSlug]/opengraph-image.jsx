import { ImageResponse } from 'next/og';
import { getColumnistAccent } from '@/app/lib/columnistConfig';
import { supabaseAdmin } from "@/app/lib/supabase";

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default async function Image({ params }) {
  const { columnistSlug, columnSlug } = await params;

  // Fetch column + columnist from Supabase
  const { data: column } = await supabaseAdmin
    .from('columns')
    .select('title, subtitle, read_time_minutes, published_at')
    .eq('slug', columnSlug)
    .single();

  const { data: columnist } = await supabaseAdmin
    .from('columnists')
    .select('name, title')
    .eq('slug', columnistSlug)
    .single();

  // If not found, fallback safely
  if (!column || !columnist) {
    return new ImageResponse(
      <div style={{ width:'100%', height:'100%', backgroundColor:'#0a0a0a',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color:'#ffffff', fontSize:'64px', fontWeight:'700' }}>HaberAI</span>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const accent = getColumnistAccent(columnistSlug);

  // Load Caveat font for signature
  let caveatFont;
  try {
    const res = await fetch('https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjcB9eIWpZQ.woff2');
    if (res.ok) caveatFont = await res.arrayBuffer();
  } catch (e) {
    console.warn('[OG] Font fetch failed, using system font');
  }

  const formattedDate = new Date(column.published_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          padding: '0',
        }}
      >
        {/* Top accent bar */}
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
          padding: '60px 80px',
          justifyContent: 'space-between',
        }}>

          {/* Header: HaberAI logo + Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
            }}>
              HaberAI
            </span>
            <span style={{
              backgroundColor: accent.primary,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '4px',
              letterSpacing: '0.5px',
            }}>
              KÖŞE YAZISI
            </span>
          </div>

          {/* Column title */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <p style={{
              color: '#ffffff',
              fontSize: '56px',
              fontWeight: '700',
              lineHeight: '1.15',
              margin: '0',
              letterSpacing: '-1px',
            }}>
              {column.title.length > 80
                ? column.title.slice(0, 80) + '…'
                : column.title}
            </p>
            {column.subtitle && (
              <p style={{
                color: '#9ca3af',
                fontSize: '24px',
                margin: '0',
                lineHeight: '1.4',
              }}>
                {column.subtitle.length > 100
                  ? column.subtitle.slice(0, 100) + '…'
                  : column.subtitle}
              </p>
            )}
          </div>

          {/* Footer: columnist info + date */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{
                color: accent.primary,
                fontSize: '36px',
                fontFamily: 'Caveat',
                fontWeight: '600',
              }}>
                {columnist.name}
              </span>
              <span style={{
                color: '#6b7280',
                fontSize: '18px',
              }}>
                {columnist.title}
              </span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px',
            }}>
              <span style={{ color: '#6b7280', fontSize: '18px' }}>
                {formattedDate}
              </span>
              <span style={{ color: '#6b7280', fontSize: '16px' }}>
                {column.read_time_minutes} dk okuma
              </span>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div style={{
          width: '100%',
          height: '2px',
          backgroundColor: accent.primary,
          opacity: 0.3,
          display: 'flex',
        }} />
      </div>
    ),
    {
      ...size,
      fonts: caveatFont ? [
        { name: 'Caveat', data: caveatFont, weight: 600, style: 'normal' },
      ] : [],
    }
  );
}
