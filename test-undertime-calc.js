// Test undertime calculation
const MANILA_TZ_ID = "Asia/Manila"

const getMinutes = (dateStr) => {
  const date = new Date(dateStr)
  // Convert to Manila time
  const manilaDate = new Date(date.toLocaleString("en-US", { timeZone: MANILA_TZ_ID }))
  return manilaDate.getHours() * 60 + manilaDate.getMinutes()
}

const calculateUndertime = (morningTimeIn, employeeType) => {
  let totalUndertimeMinutes = 0

  // Teaching schedule: 7:30 AM start (450 minutes from midnight)
  const MORNING_START = 7 * 60 + 30 // 450 minutes

  if (morningTimeIn) {
    const inMinutes = getMinutes(morningTimeIn)
    console.log(`Time In: ${morningTimeIn}`)
    console.log(`In Minutes: ${inMinutes} (${Math.floor(inMinutes/60)}:${inMinutes%60})`)
    console.log(`Morning Start: ${MORNING_START} (${Math.floor(MORNING_START/60)}:${MORNING_START%60})`)
    
    if (inMinutes > MORNING_START) {
      totalUndertimeMinutes += (inMinutes - MORNING_START)
      console.log(`Undertime: ${totalUndertimeMinutes} minutes`)
    }
  }

  const h = Math.floor(totalUndertimeMinutes / 60)
  const m = totalUndertimeMinutes % 60
  
  if (h > 0) {
    return `${h}h ${m}m`
  }
  return `${m}m`
}

// Test Case 1: 7:34 AM
console.log("=== Test Case 1: 7:34 AM ===")
// Create a date string in ISO format for 7:34 AM Manila time
const date1 = new Date("2025-11-29T07:34:00+08:00") // Manila timezone
console.log("Result:", calculateUndertime(date1.toISOString(), "TEACHING_PERSONNEL"))
console.log()

// Test Case 2: 9:05 AM
console.log("=== Test Case 2: 9:05 AM ===")
const date2 = new Date("2025-11-29T09:05:00+08:00") // Manila timezone
console.log("Result:", calculateUndertime(date2.toISOString(), "TEACHING_PERSONNEL"))
