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

const mistralApiKey = process.env.MISTRAL_API_KEY;
if (!mistralApiKey) {
  console.error("No API key found.");
  process.exit(1);
}

const models = [
  "mistral-small-latest",
  "open-mistral-7b",
  "open-mixtral-8x7b",
  "mistral-large-latest",
  "pixtral-12b-2409"
];

async function testModel(model) {
  console.log(`\nTesting model: ${model}...`);
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Say hello!" }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Success! Response: "${data.choices[0].message.content.trim()}"`);
      return true;
    } else {
      console.log(`✗ Failed with status ${response.status}`);
      const text = await response.text();
      console.log(text);
      return false;
    }
  } catch (err) {
    console.error("Error:", err.message);
    return false;
  }
}

async function runTests() {
  for (const model of models) {
    await testModel(model);
  }
}

runTests();
