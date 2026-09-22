import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envVars = {};
  const files = ['.env', '.env.local'];
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valParts] = trimmed.split('=');
          if (key && valParts.length > 0) {
            let val = valParts.join('=').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1).trim();
            }
            envVars[key.trim()] = val;
          }
        }
      });
    }
  }
  return envVars;
}

const env = loadEnv();
const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);

const users = [
  'ceo@textech.garments',
  'admin@textech.garments',
  'seniormechanic@textech.garments',
  'mechanic@textech.garments',
  'stores@textech.garments'
];

async function checkAll() {
  for (const u of users) {
    try {
      const res = await signInWithEmailAndPassword(auth, u, 'sewing123');
      console.log('SUCCESS:', u, res.user.uid);
    } catch (e) {
      console.log('FAIL:', u, e.code, e.message);
    }
  }
}
checkAll();
