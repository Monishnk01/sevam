const { db, runAsync, allAsync } = require('./db');

async function updateCoords() {
  console.log("Updating all existing users to Mysuru coordinates...");
  
  const restaurants = await allAsync("SELECT * FROM restaurants");
  for (const r of restaurants) {
    const lat = 12.3051 + (Math.random() * 0.04 - 0.02);
    const lng = 76.6413 + (Math.random() * 0.04 - 0.02);
    await runAsync("UPDATE restaurants SET latitude = ?, longitude = ?, address = ? WHERE id = ?", [lat, lng, 'Mysuru, Karnataka, India', r.id]);
  }
  
  const receivers = await allAsync("SELECT * FROM receivers");
  for (const r of receivers) {
    const lat = 12.3051 + (Math.random() * 0.04 - 0.02);
    const lng = 76.6413 + (Math.random() * 0.04 - 0.02);
    await runAsync("UPDATE receivers SET latitude = ?, longitude = ?, address = ? WHERE id = ?", [lat, lng, 'Mysuru, Karnataka, India', r.id]);
  }
  
  console.log("Done updating coordinates!");
}

updateCoords().then(() => {
  process.exit(0);
}).catch(console.error);
