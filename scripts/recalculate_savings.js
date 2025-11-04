import Database from '@adonisjs/lucid/services/db'

async function recalculateSavings() {
  console.log('Starting savings recalculation...')
  
  try {
    // Get all plan subscribers with their calculated totals
    const results = await Database.rawQuery(`
      UPDATE plan_subscribers 
      SET current_amount = COALESCE(calculated_total, 0)
      FROM (
        SELECT 
          ps.id,
          ps.user_id,
          ps.plan_id,
          ps.current_amount as old_amount,
          COALESCE(SUM(pt.amount), 0) as calculated_total
        FROM plan_subscribers ps
        LEFT JOIN plan_transactions pt ON pt.plan_id = ps.plan_id 
          AND pt.user_id = ps.user_id 
          AND pt.transaction_type = 'DEPOSIT'
        GROUP BY ps.id, ps.user_id, ps.plan_id, ps.current_amount
      ) calc
      WHERE plan_subscribers.id = calc.id
      AND plan_subscribers.current_amount != COALESCE(calc.calculated_total, 0)
      RETURNING 
        plan_subscribers.id,
        plan_subscribers.user_id,
        plan_subscribers.plan_id,
        calc.old_amount,
        plan_subscribers.current_amount as new_amount
    `)
    
    console.log(`Updated ${results.length} plan subscribers:`)
    
    // Show the changes
    for (const row of results) {
      console.log(`Plan Subscriber ID: ${row.id}, User: ${row.user_id}, Plan: ${row.plan_id}`)
      console.log(`  Old Amount: ${row.old_amount}`)
      console.log(`  New Amount: ${row.new_amount}`)
      console.log(`  Difference: ${row.new_amount - row.old_amount}`)
      console.log('---')
    }
    
    // Summary query
    const summary = await Database.rawQuery(`
      SELECT 
        COUNT(*) as total_subscribers,
        SUM(current_amount) as total_savings,
        AVG(current_amount) as avg_savings
      FROM plan_subscribers 
      WHERE status = 'Active'
    `)
    
    console.log('Summary after recalculation:')
    console.log(`Total Active Subscribers: ${summary[0].total_subscribers}`)
    console.log(`Total Savings: ${summary[0].total_savings}`)
    console.log(`Average Savings: ${summary[0].avg_savings}`)
    
  } catch (error) {
    console.error('Error recalculating savings:', error)
  }
}

// Run the script
recalculateSavings().then(() => {
  console.log('Recalculation completed!')
  process.exit(0)
}).catch(console.error)