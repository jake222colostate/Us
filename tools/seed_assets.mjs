import fs from "fs";
import path from "path";
import https from "https";

const OUT_DIR = path.resolve("apps/mobile/assets/dev");
const MANIFEST = [
  { name: "icon.png", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=512&h=512&fit=crop&fm=png", includeInManifest: false },
  { name: "adaptive-icon.png", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=512&h=512&fit=crop&fm=png", includeInManifest: false },
  { name: "favicon.png", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=128&h=128&fit=crop&fm=png", includeInManifest: false },
  { name: "avatar1.jpg", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800", includeInManifest: true },
  { name: "avatar2.jpg", url: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=800", includeInManifest: true },
  { name: "post1.jpg",   url: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1080", includeInManifest: true },
  { name: "post2.jpg",   url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080", includeInManifest: true },
  { name: "post3.jpg",   url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1080", includeInManifest: true }
];

function dl(u, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(u, res => {
      if (res.statusCode >= 400) {
        file.close(); fs.unlink(dest, ()=>{});
        return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", err => {
      file.close(); fs.unlink(dest, ()=>{});
      reject(err);
    });
  });
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  for (const item of MANIFEST) {
    const to = path.join(OUT_DIR, item.name);
    try { await dl(item.url, to); written.push(item.name); }
    catch (e) { console.error("Failed:", item.url, e.message); }
  }
  const manifestFiles = MANIFEST.filter((item) => item.includeInManifest !== false && written.includes(item.name)).map((item) => item.name);
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify({ files: manifestFiles }, null, 2));
  console.log("Seeded assets:", written);
})();
