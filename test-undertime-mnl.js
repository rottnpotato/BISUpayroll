// Test undertime calculation with Manila Standard Time
const MANILA_OFFSET_HOURS = 8
const HOUR_MS = 60 * 60 * 1000

function getManilaHours(input) {
  const d = input instanceof Date ? input : new Date(input)
  const manila = new Date(d.getTime() + MANILA_OFFSET_HOURS * HOUR_MS)
  return manila.getUTCHours()
}

function getManilaMinutes(input) {
  const d = input instanceof Date ? input : new Date(input)
  const manila = new Date(d.getTime() + MANILA_OFFSET_HOURS * HOUR_MS)
  return manila.getUTCMinutes()
}

const getMinutes = (dateStr) => {
  const date = new Date(dateStr)
  const hours = getManilaHours(date)
  const minutes = getManilaMinutes(date)
  return hours * 60 + minutes
}

const calculateUndertime = (morningTimeIn, employeeType) => {
  let totalUndertimeMinutes = 0

  // Teaching schedule: 7:30 AM start (450 minutes from midnight)
  const MORNING_START = 7 * 60 + 30 // 450 minutes

  if (morningTimeIn) {
    const inMinutes = getMinutes(morningTimeIn)
    console.log(`Time In: ${morningTimeIn}`)
    console.log(`In Minutes: ${inMinutes} (${Math.floor(inMinutes/60)}:${String(inMinutes%60).padStart(2,'0')})`)
    console.log(`Morning Start: ${MORNING_START} (${Math.floor(MORNING_START/60)}:${String(MORNING_START%60).padStart(2,'0')})`)
    
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

// Test Case 1: 7:34 AM Manila Time
console.log("=== Test Case 1: 7:34 AM Manila Time ===")
// ISO string in UTC that represents 7:34 AM Manila (which is 11:34 PM previous day UTC)
const date1 = new Date("2025-11-28T23:34:00.000Z")
console.log("Result:", calculateUndertime(date1.toISOString(), "TEACHING_PERSONNEL"))
console.log()

// Test Case 2: 9:05 AM Manila Time
console.log("=== Test Case 2: 9:05 AM Manila Time ===")
// ISO string in UTC that represents 9:05 AM Manila (which is 1:05 AM same day UTC)
const date2 = new Date("2025-11-29T01:05:00.000Z")
console.log("Result:", calculateUndertime(date2.toISOString(), "TEACHING_PERSONNEL"))
console.log()

// Test Case 3: 8:00 AM Non-Teaching (should be on time)
console.log("=== Test Case 3: 8:00 AM Non-Teaching ===")
const date3 = new Date("2025-11-29T00:00:00.000Z") // 8:00 AM Manila
const MORNING_START_NT = 8 * 60
const inMinutes3 = getMinutes(date3.toISOString())
console.log(`In Minutes: ${inMinutes3} vs Start: ${MORNING_START_NT}`)
if (inMinutes3 > MORNING_START_NT) {
  console.log(`Undertime: ${inMinutes3 - MORNING_START_NT} minutes`)
} else {
  console.log("On time!")
}
