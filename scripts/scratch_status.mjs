import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
  envConfig.forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.split(' #')[0].trim();
      value = value.replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.PUBLICATION_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLICATION_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error fetching count:", error);
    return;
  }

  console.log("Total articles in database:", count);

  const { data: statusData } = await supabase
    .from('articles')
    .select('status, id, title, content');

  const counts = {};
  statusData.forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  console.log("Status counts:", counts);

  console.log("\nSample articles details:");
  statusData.slice(0, 50).forEach((art, idx) => {
    const upgraded = art.content.includes("Medical Review: MedSense Editorial Board");
    const executiveSummary = art.content.includes("Executive Summary") || art.content.includes("<h3>Executive Summary</h3>");
    console.log(`${idx+1}. [${art.status}] [Upgraded: ${upgraded ? "Yes" : "No"}] [ExecSummary: ${executiveSummary ? "Yes" : "No"}] ${art.title} (len: ${art.content ? art.content.length : 0})`);
  });
}

checkStatus();
