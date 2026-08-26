import fs from "fs";

let emails = [];
for (let i = 1; i <= 1000; i++) {
  emails.push(`loadtest${i}@example.com`);
}

fs.writeFileSync("d:/projects/outbox/backend/scratch/1000-emails.txt", emails.join(", "));
console.log("Created 1000-emails.txt");
