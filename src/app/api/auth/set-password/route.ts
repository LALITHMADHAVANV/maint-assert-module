import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a Supabase client with the service role key for admin privileges
function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key is missing in environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Search for existing user by email
    // In Supabase, the best way to get a user by email via admin API is to list users or just try creating/updating
    // Since we don't have a direct "getUserByEmail" that is simple without pagination, we'll try to find them in the public.users table first
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.trim())
      .single();

    if (existingUser) {
      // User exists, update password via Admin API
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: password.trim() }
      );

      if (updateError) {
        throw updateError;
      }

      // Update public.users profile if needed
      const updatePayload: any = { defaultPassword: password.trim() };
      if (name) updatePayload.name = name;
      if (role) updatePayload.role = role;
      updatePayload.updatedAt = new Date().toISOString();

      await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', existingUser.id);

      return NextResponse.json({
        success: true,
        message: `Password for ${email} has been updated to '${password}' in Supabase Auth!`,
        uid: existingUser.id,
      });
    } else {
      // User does not exist, create new user with password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password.trim(),
        email_confirm: true, // Auto-confirm email
      });

      if (createError) {
        return NextResponse.json(
          { error: createError.message || 'Failed to create user in Supabase Auth' },
          { status: 500 }
        );
      }

      if (newUser.user) {
        // Sync to public.users table
        await supabaseAdmin
          .from('users')
          .insert({
            id: newUser.user.id,
            uid: newUser.user.id,
            email: email.trim(),
            name: name || email.split('@')[0],
            role: role || 'MECHANIC',
            title: 'Factory Staff',
            created_at: new Date().toISOString(),
          });

        return NextResponse.json({
          success: true,
          message: `User ${email} created with password '${password}' in Supabase Auth!`,
          uid: newUser.user.id,
        });
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
