const https = require('https');

const base_url = 'https://actuarygpt-backend.onrender.com';
const app_payload = JSON.stringify({
    "client": "customer1",
    "age": 0.35,
    "height": 175.0,
    "weight": 70.0,
    "bmi": 22.9,
    "product_info_2": "A1",
    "occupation": "Software Developer",
    "income": 120000.0,
    "smoker": 0,
    "previous_claims": 0,
    "family_history": 0,
    "insurance_type": "Life",
    "coverage_amount": 500000.0,
    "exercise": 1,
    "alcohol": 0,
    "gender": "Male",
    "full_name": "Test Customer",
    "email": "test@customer.com",
    "phone": "1234567890",
    "medical_conditions": "None",
    "policy_duration": 10,
    "nominee_age": 30
});

let attempts = 0;
const maxAttempts = 15;

function createAndEvaluate() {
  attempts++;
  console.log(`\nAttempt ${attempts}/${maxAttempts}...`);

  // 1. Create Application
  const opt1 = {
    hostname: 'actuarygpt-backend.onrender.com',
    path: '/applications',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(app_payload)
    }
  };

  const req1 = https.request(opt1, (res1) => {
    let data1 = '';
    res1.on('data', chunk => data1 += chunk);
    res1.on('end', () => {
      if (res1.statusCode !== 200) {
        console.log(`Failed to create application. Status: ${res1.statusCode}. Body: ${data1}`);
        retry();
        return;
      }
      const app = JSON.parse(data1);
      const appId = app.id;
      console.log(`Created application: ${appId}`);

      // 2. Evaluate Application
      const opt2 = {
        hostname: 'actuarygpt-backend.onrender.com',
        path: `/applications/${appId}/evaluate`,
        method: 'POST'
      };

      const req2 = https.request(opt2, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log(`Evaluation Status: ${res2.statusCode}`);
          console.log(`Evaluation Body: ${data2}`);
          if (res2.statusCode === 200) {
            console.log("REMOTE EVALUATION SUCCEEDED! NEW DEPLOY IS LIVE!");
            process.exit(0);
          } else {
            console.log("Evaluation failed. Still running old code or other error.");
            retry();
          }
        });
      });
      req2.on('error', err => {
        console.log(`Evaluation request error: ${err.message}`);
        retry();
      });
      req2.end();
    });
  });

  req1.on('error', err => {
    console.log(`Create request error: ${err.message}`);
    retry();
  });
  req1.write(app_payload);
  req1.end();
}

function retry() {
  if (attempts < maxAttempts) {
    setTimeout(createAndEvaluate, 20000);
  } else {
    console.log("Reached max attempts. New deploy is still not online or still failing.");
    process.exit(1);
  }
}

createAndEvaluate();
