const { runAsync, allAsync } = require('./db');
const { exec } = require('child_process');
const path = require('path');

const FOODS = [
  { name: 'Chicken Biryani', avgPrepared: 120, baseRemaining: 15 },
  { name: 'Veg Fried Rice', avgPrepared: 80, baseRemaining: 10 },
  { name: 'Paneer Butter Masala', avgPrepared: 60, baseRemaining: 8 },
  { name: 'Garlic Naan', avgPrepared: 150, baseRemaining: 20 }
];

async function seedRestaurantData(restaurantId) {
  console.log(`Starting mock data seeding for restaurant: ${restaurantId}...`);
  
  // Clean up existing entries for this restaurant to prevent duplicates
  await runAsync(`DELETE FROM food_entries WHERE restaurant_id = ?`, [restaurantId]);
  
  const today = new Date();
  const entries = [];
  
  // Seed last 15 days of data
  for (let i = 15; i >= 1; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    
    // Format YYYY-MM-DD
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Add realistic variation: weekends have higher preparation but slightly lower relative remaining (more customers)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const scaleFactor = isWeekend ? 1.3 : 0.95;
    
    FOODS.forEach((food) => {
      // Prepared quantity varies slightly
      const randPrep = Math.round(food.avgPrepared * scaleFactor + (Math.random() * 20 - 10));
      // Remaining quantity has standard variance plus higher leftovers on slow mid-week days (e.g. Wednesday = 3)
      const dayFactor = dayOfWeek === 3 ? 1.4 : (isWeekend ? 0.7 : 1.0);
      let randRem = Math.round(food.baseRemaining * dayFactor + (Math.random() * 8 - 4));
      
      // Safety bounds
      randRem = Math.max(0, Math.min(randRem, randPrep - 5));
      
      entries.push({
        id: `entry_${restaurantId}_${dateStr}_${food.name.replace(/\s+/g, '_')}`,
        restaurantId,
        foodName: food.name,
        quantityPrepared: randPrep,
        quantityRemaining: randRem,
        date: dateStr,
        timeSlot: 'dinner'
      });
    });
  }
  
  // Insert entries sequentially into database
  for (const entry of entries) {
    await runAsync(
      `INSERT INTO food_entries (id, restaurant_id, food_name, quantity_prepared, quantity_remaining, date, time_slot)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.restaurantId,
        entry.foodName,
        entry.quantityPrepared,
        entry.quantityRemaining,
        entry.date,
        entry.timeSlot
      ]
    );
  }
  
  console.log(`Seeded ${entries.length} food entries successfully.`);
  
  // Run training process for the restaurant
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'ai_agent.py');
    const cmd = `python "${scriptPath}" --action train --restaurant "${restaurantId}"`;
    console.log(`Executing training command: ${cmd}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`AI Model Training Error: ${error.message}`);
        resolve({
          success: true,
          message: `Seeded ${entries.length} entries. However, AI Training failed. Make sure Python requirements are met.`,
          error: error.message
        });
      } else {
        try {
          const result = JSON.parse(stdout.trim());
          console.log(`AI Training Output:`, result);
          resolve({
            success: true,
            message: `Successfully seeded 15 days of historical data and trained Random Forest Regressor!`,
            aiResult: result
          });
        } catch (e) {
          console.log(`AI Raw Output:`, stdout);
          resolve({
            success: true,
            message: `Seeded 15 days of historical data and triggered AI Training. Output: ${stdout}`,
          });
        }
      }
    });
  });
}

module.exports = { seedRestaurantData };
