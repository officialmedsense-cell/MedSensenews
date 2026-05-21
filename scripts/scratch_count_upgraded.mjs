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
  const { data: statusData, error } = await supabase
    .from('articles')
    .select('status, id, title, content');

  if (error) {
    console.error("Error fetching articles:", error);
    return;
  }

  const total = statusData.length;
  const upgraded = statusData.filter(r => r.content && r.content.includes("Medical Review: MedSense Editorial Board")).length;
  const execSummary = statusData.filter(r => r.content && r.content.includes("Executive Summary")).length;
  const keyTakeaways = statusData.filter(r => r.content && r.content.includes("Key Takeaways")).length;
  const faq = statusData.filter(r => r.content && r.content.includes("Frequently Asked Questions")).length;

  console.log("Total articles in database:", total);
  console.log("Upgraded (Medical Review Footer):", upgraded);
  console.log("Has Executive Summary:", execSummary);
  console.log("Has Key Takeaways:", keyTakeaways);
  console.log("Has FAQ:", faq);

  const notUpgraded = statusData.filter(r => !r.content || !r.content.includes("Medical Review: MedSense Editorial Board"));
  console.log("Not Upgraded count:", notUpgraded.length);
  if (notUpgraded.length > 0) {
    console.log("\nSome unupgraded articles:");
    notUpgraded.slice(0, 10).forEach((art, idx) => {
      console.log(`${idx + 1}. [${art.status}] ${art.title} (len: ${art.content ? art.content.length : 0})`);
    });
  }
}

checkStatus();
