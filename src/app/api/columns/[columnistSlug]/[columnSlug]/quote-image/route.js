import { ImageResponse } from 'next/og';
import { getColumnistAccent } from '@/app/lib/columnistConfig';
import { supabaseAdmin } from "@/app/lib/supabase";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const formatArg = searchParams.get('format');
  const format = formatArg === 'square'
    ? { width: 1080, height: 1080 }
    : { width: 1200, height: 630 };

  const { columnistSlug, columnSlug } = await params;

  // Fetch column + columnist from Supabase
  const { data: column } = await supabaseAdmin
    .from('columns')
    .select('featured_quote')
    .eq('slug', columnSlug)
    .single();

  const { data: columnist } = await supabaseAdmin
    .from('columnists')
    .select('name')
    .eq('slug', columnistSlug)
    .single();

  if (!column || !columnist || !column.featured_quote) {
    return new ImageResponse(<div style={{ width: '100%', height: '100%', backgroundColor: '#f8f9fa' }} />);
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
        backgroundColor: accent.light || '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        position: 'relative',
      }}>
        {/* Large decorative quote mark */}
        <div style={{
          fontSize: '160px',
          color: accent.primary,
          opacity: 0.15,
          lineHeight: '1',
          position: 'absolute',
          top: '40px',
          left: '60px',
          display: 'flex',
          fontFamily: 'Georgia, serif',
        }}>
          &quot;
        </div>

        {/* Quote text */}
        <p style={{
          fontSize: format.width === 1080 ? '46px' : '42px',
          color: '#1a1a1a',
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: '1.4',
          margin: '0 0 48px 0',
          maxWidth: '85%',
          zIndex: 1,
        }}>
          &quot;{column.featured_quote}&quot;
        </p>

        {/* Divider */}
        <div style={{
          width: '60px',
          height: '3px',
          backgroundColor: accent.primary,
          marginBottom: '32px',
          display: 'flex',
        }} />

        {/* Author */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            fontFamily: 'Caveat',
            fontSize: '40px',
            color: accent.primary,
            fontWeight: '600',
          }}>
            {columnist.name}
          </span>
          <span style={{
            fontSize: '18px',
            color: '#6b7280',
            letterSpacing: '1px',
            fontWeight: '600',
          }}>
            HaberAI KÖŞE YAZISI
          </span>
        </div>
      </div>
    ),
    {
      ...format,
      fonts: [
        { name: 'Caveat', data: caveatFont, weight: 600, style: 'normal' },
      ],
    }
  );
}
