import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Move initialization inside handler to prevent build-time crashes if key is missing
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] API Key missing. Email functionality will be disabled.');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

// Use the service-role key on the server for trusted inserts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, name, categories } = await request.json();

    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter.' },
          { status: 409 }
        );
      }
      // Re-activate if they previously unsubscribed
      const { error: updateError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .update({
          status: 'active',
          name: name || null,
          categories: categories || [],
          resubscribed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        message: 'Welcome back! Your subscription has been reactivated.',
      });
    }

    // Insert new subscriber
    const { error: insertError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        categories: categories || [],
        status: 'active',
        subscribed_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Send Welcome Email
    try {
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
        from: 'MedSense News <onboarding@resend.dev>',
        to: email.toLowerCase().trim(),
        subject: 'Welcome to MedSense News!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h1 style="color: #1e3a8a;">Welcome to MedSense News!</h1>
            <p>Hello ${name || 'there'},</p>
            <p>Thank you for subscribing to MedSense News. You are now part of a community dedicated to accurate, timely, and impactful medical information.</p>
            <p>You'll receive our latest updates on medical news, research discoveries, and healthcare innovations directly in your inbox.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>MedSense News · Digital Health & Medical Journalism</p>
              <p>If you didn't sign up for this, you can safely ignore this email.</p>
            </div>
          </div>
        `
        });
      }
    } catch (emailErr) {
      console.warn('[Newsletter Welcome Email Failed]', emailErr);
    }

    return NextResponse.json({
      message: 'You have successfully subscribed to MedSense News!',
    });
  } catch (err) {
    console.error('[Newsletter API]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// Unsubscribe route – called via GET with ?email=...&token=...
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim());

    if (error) throw error;

    return NextResponse.json({ message: 'You have been unsubscribed.' });
  } catch (err) {
    console.error('[Newsletter Unsubscribe]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
