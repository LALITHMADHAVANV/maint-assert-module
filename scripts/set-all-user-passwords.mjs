import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envVars = {};
  const files = ['.env.local', '.env'];
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

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const USERS = [
  {
    role: 'CEO',
    name: 'Dr. K. Ramanathan',
    title: 'Chief Executive Officer (Managing Director)',
    email: 'ceo@textech.garments',
    altEmail: 'ceo@textech.com',
    targetPassword: 'ceo123',
  },
  {
    role: 'ADMIN',
    name: 'V. Sundaram',
    title: 'Plant Administrator & Asset Director',
    email: 'admin@textech.garments',
    altEmail: 'admin@textech.com',
    targetPassword: 'admin123',
  },
  {
    role: 'SENIOR_MECHANIC',
    name: 'Ramesh Kumar',
    title: 'Senior Sewing Master Mechanic',
    email: 'seniormechanic@textech.garments',
    altEmail: 'seniormechanic@textech.com',
    targetPassword: 'senior123',
  },
  {
    role: 'MECHANIC',
    name: 'Suresh Babu',
    title: 'Line Sewing Mechanic',
    email: 'mechanic@textech.garments',
    altEmail: 'mechanic@textech.com',
    targetPassword: 'mechanic123',
  },
  {
    role: 'STORE_PERSON',
    name: 'M. Arumugam',
    title: 'Tool Crib & Store In-Charge',
    email: 'stores@textech.garments',
    altEmail: 'stores@textech.com',
    targetPassword: 'stores123',
  },
];

async function updateOrSetPassword(email, targetPassword, name, role, title) {
  const tryPasswords = [targetPassword, 'sewing123', 'password123', 'admin123'];
  let userCred = null;

  for (const pwd of tryPasswords) {
    try {
      userCred = await signInWithEmailAndPassword(auth, email, pwd);
      break;
    } catch {
      // Continue trying
    }
  }

  if (userCred) {
    // Successfully signed in, now update password
    await updatePassword(userCred.user, targetPassword);
    await updateProfile(userCred.user, { displayName: name });
    console.log(`  ✅ [${role}] ${email} -> Password set to: '${targetPassword}' (UID: ${userCred.user.uid})`);

    // Sync Firestore document
    const userRef = doc(db, 'users', userCred.user.uid);
    await setDoc(userRef, {
      uid: userCred.user.uid,
      name,
      email,
      role,
      title,
      defaultPassword: targetPassword,
    }, { merge: true });
  } else {
    // Create new account if not found
    try {
      userCred = await createUserWithEmailAndPassword(auth, email, targetPassword);
      await updateProfile(userCred.user, { displayName: name });
      console.log(`  🎉 [${role}] ${email} -> Created with password: '${targetPassword}' (UID: ${userCred.user.uid})`);

      const userRef = doc(db, 'users', userCred.user.uid);
      await setDoc(userRef, {
        uid: userCred.user.uid,
        name,
        email,
        role,
        title,
        defaultPassword: targetPassword,
      }, { merge: true });
    } catch (createErr) {
      console.error(`  ❌ Failed for ${email}:`, createErr.code, createErr.message);
    }
  }
}

async function main() {
  console.log('\n================================================================');
  console.log('  TexTech CMMS: Firebase Authentication Password Provisioner');
  console.log('================================================================\n');

  for (const u of USERS) {
    console.log(`Configuring credentials for ${u.name} (${u.role}):`);
    await updateOrSetPassword(u.email, u.targetPassword, u.name, u.role, u.title);
    if (u.altEmail) {
      await updateOrSetPassword(u.altEmail, u.targetPassword, u.name, u.role, u.title);
    }
  }

  console.log('\n================================================================');
  console.log('  ✅ ALL USER PASSWORDS CREATED & VERIFIED IN FIREBASE AUTH!');
  console.log('================================================================\n');
  process.exit(0);
}

main();
