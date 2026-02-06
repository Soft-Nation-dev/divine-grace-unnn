import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
};

const hasFlag = (name) => args.includes(name);

const filePath = getArg('--file', 'neon.sql');
const doCreate = hasFlag('--create');
const doSendReset = hasFlag('--send-reset');
const doMarkMigrated = hasFlag('--mark-migrated');
const dryRun = hasFlag('--dry-run') || (!doCreate && !doSendReset && !doMarkMigrated);
const limit = Number(getArg('--limit', '0'));
const redirectTo = process.env.RESET_REDIRECT_URL || '';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';

if ((doCreate || doSendReset || doMarkMigrated) && (!supabaseUrl || !serviceKey)) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const startMarker = 'COPY public."AspNetUsers"';
let inCopy = false;
let users = [];

const clean = (value) => {
  if (value === undefined || value === null) return '';
  if (value === '\\N') return '';
  return value.trim();
};

for (const line of lines) {
  if (!inCopy) {
    if (line.startsWith(startMarker)) {
      if (line.includes('FROM stdin;')) {
        inCopy = true;
      }
    }
    continue;
  }

  if (line.trim() === '\\.') break;
  if (!line.trim()) continue;

  const parts = line.split('\t');
  if (parts.length < 6) continue;

  const title = clean(parts[1]);
  const fullName = clean(parts[2]);
  const email = clean(parts[5]) || clean(parts[3]);

  if (!email || !email.includes('@')) continue;

  users.push({
    email: email.toLowerCase(),
    fullName,
    title
  });
}

const byEmail = new Map();
for (const user of users) {
  if (!byEmail.has(user.email)) byEmail.set(user.email, user);
}

users = Array.from(byEmail.values());
if (limit > 0) users = users.slice(0, limit);

console.log(`Found ${users.length} unique users to import.`);

if (dryRun) {
  console.log('Dry run only. Use --create to import, --mark-migrated to tag users, or --send-reset to send reset emails.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

const fetchUserByEmail = async (email) => {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Lookup failed with status ${res.status}`);
  }

  const data = await res.json();
  const user = Array.isArray(data?.users) ? data.users[0] : data?.user || null;
  return user;
};

const makeTempPassword = () => {
  return crypto.randomBytes(12).toString('base64url');
};

let created = 0;
let skipped = 0;
let resetSent = 0;
let marked = 0;
let failed = 0;

for (const user of users) {
  try {
    if (doCreate) {
      const password = makeTempPassword();
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          title: user.title,
          migrated: true,
          password_reset_complete: false
        }
      });

      if (error) {
        if (error.message && error.message.toLowerCase().includes('already')) {
          skipped += 1;
        } else {
          console.error(`Create failed for ${user.email}: ${error.message}`);
          failed += 1;
          continue;
        }
      } else if (data?.user?.id) {
        created += 1;
      }
    }

    if (doMarkMigrated) {
      let existingUser = null;
      try {
        existingUser = await fetchUserByEmail(user.email);
      } catch (lookupErr) {
        console.error(`Lookup failed for ${user.email}: ${lookupErr?.message || lookupErr}`);
        failed += 1;
        continue;
      }

      if (!existingUser?.id) {
        console.error(`Lookup failed for ${user.email}: User not found`);
        failed += 1;
        continue;
      }

      const existing = existingUser.user_metadata || {};
      const merged = {
        ...existing,
        migrated: true,
        password_reset_complete: false,
        full_name: existing.full_name || user.fullName,
        title: existing.title || user.title
      };

      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: merged
      });

      if (updateError) {
        console.error(`Metadata update failed for ${user.email}: ${updateError.message}`);
        failed += 1;
        continue;
      }

      marked += 1;
    }

    if (doSendReset) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: redirectTo || undefined
      });

      if (resetError) {
        console.error(`Reset email failed for ${user.email}: ${resetError.message}`);
        failed += 1;
        continue;
      }
      resetSent += 1;
    }
  } catch (err) {
    console.error(`Unexpected error for ${user.email}: ${err.message}`);
    failed += 1;
  }
}

console.log('Done.');
console.log(`Created: ${created}`);
console.log(`Skipped (already exists): ${skipped}`);
console.log(`Marked migrated: ${marked}`);
console.log(`Reset emails sent: ${resetSent}`);
console.log(`Failed: ${failed}`);
