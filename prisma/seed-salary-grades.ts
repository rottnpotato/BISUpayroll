import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Salary grades following the 2024 SSL (Salary Standardization Law)
// Each position with rank maps to a salary grade, and each salary grade has 8 steps
// Format: grade, step, position, rank (Roman numeral), monthlyRate, dailyRate

const salaryGradesData = [
  // Salary Grade 1 - Administrative Aide I (8 steps)
  { grade: 1, step: 1, position: "Administrative Aide", rank: 1, monthlyRate: 13530, dailyRate: 614.55 },
  { grade: 1, step: 2, position: "Administrative Aide", rank: 1, monthlyRate: 13633, dailyRate: 619.23 },
  { grade: 1, step: 3, position: "Administrative Aide", rank: 1, monthlyRate: 13748, dailyRate: 624.45 },
  { grade: 1, step: 4, position: "Administrative Aide", rank: 1, monthlyRate: 13862, dailyRate: 629.64 },
  { grade: 1, step: 5, position: "Administrative Aide", rank: 1, monthlyRate: 13979, dailyRate: 634.95 },
  { grade: 1, step: 6, position: "Administrative Aide", rank: 1, monthlyRate: 14095, dailyRate: 640.23 },
  { grade: 1, step: 7, position: "Administrative Aide", rank: 1, monthlyRate: 14213, dailyRate: 645.59 },
  { grade: 1, step: 8, position: "Administrative Aide", rank: 1, monthlyRate: 14331, dailyRate: 650.95 },
  
  // Salary Grade 2 - Administrative Aide II (8 steps)
  { grade: 2, step: 1, position: "Administrative Aide", rank: 2, monthlyRate: 14372, dailyRate: 652.82 },
  { grade: 2, step: 2, position: "Administrative Aide", rank: 2, monthlyRate: 14482, dailyRate: 657.82 },
  { grade: 2, step: 3, position: "Administrative Aide", rank: 2, monthlyRate: 14593, dailyRate: 662.86 },
  { grade: 2, step: 4, position: "Administrative Aide", rank: 2, monthlyRate: 14706, dailyRate: 668.00 },
  { grade: 2, step: 5, position: "Administrative Aide", rank: 2, monthlyRate: 14818, dailyRate: 673.09 },
  { grade: 2, step: 6, position: "Administrative Aide", rank: 2, monthlyRate: 14931, dailyRate: 678.23 },
  { grade: 2, step: 7, position: "Administrative Aide", rank: 2, monthlyRate: 15047, dailyRate: 683.50 },
  { grade: 2, step: 8, position: "Administrative Aide", rank: 2, monthlyRate: 15161, dailyRate: 688.68 },
  
  // Salary Grade 3 - Administrative Aide III (8 steps)
  { grade: 3, step: 1, position: "Administrative Aide", rank: 3, monthlyRate: 15265, dailyRate: 693.41 },
  { grade: 3, step: 2, position: "Administrative Aide", rank: 3, monthlyRate: 15384, dailyRate: 698.82 },
  { grade: 3, step: 3, position: "Administrative Aide", rank: 3, monthlyRate: 15501, dailyRate: 704.14 },
  { grade: 3, step: 4, position: "Administrative Aide", rank: 3, monthlyRate: 15621, dailyRate: 709.59 },
  { grade: 3, step: 5, position: "Administrative Aide", rank: 3, monthlyRate: 15741, dailyRate: 715.05 },
  { grade: 3, step: 6, position: "Administrative Aide", rank: 3, monthlyRate: 15861, dailyRate: 720.50 },
  { grade: 3, step: 7, position: "Administrative Aide", rank: 3, monthlyRate: 15984, dailyRate: 726.09 },
  { grade: 3, step: 8, position: "Administrative Aide", rank: 3, monthlyRate: 16105, dailyRate: 731.59 },
  
  // Salary Grade 4 - Administrative Aide IV (8 steps)
  { grade: 4, step: 1, position: "Administrative Aide", rank: 4, monthlyRate: 16209, dailyRate: 736.32 },
  { grade: 4, step: 2, position: "Administrative Aide", rank: 4, monthlyRate: 16334, dailyRate: 742.00 },
  { grade: 4, step: 3, position: "Administrative Aide", rank: 4, monthlyRate: 16460, dailyRate: 747.73 },
  { grade: 4, step: 4, position: "Administrative Aide", rank: 4, monthlyRate: 16586, dailyRate: 753.45 },
  { grade: 4, step: 5, position: "Administrative Aide", rank: 4, monthlyRate: 16714, dailyRate: 759.27 },
  { grade: 4, step: 6, position: "Administrative Aide", rank: 4, monthlyRate: 16841, dailyRate: 765.05 },
  { grade: 4, step: 7, position: "Administrative Aide", rank: 4, monthlyRate: 16971, dailyRate: 770.95 },
  { grade: 4, step: 8, position: "Administrative Aide", rank: 4, monthlyRate: 17101, dailyRate: 776.86 },
  
  // Salary Grade 5 - Administrative Aide V (8 steps)
  { grade: 5, step: 1, position: "Administrative Aide", rank: 5, monthlyRate: 17205, dailyRate: 781.59 },
  { grade: 5, step: 2, position: "Administrative Aide", rank: 5, monthlyRate: 17338, dailyRate: 787.64 },
  { grade: 5, step: 3, position: "Administrative Aide", rank: 5, monthlyRate: 17471, dailyRate: 793.68 },
  { grade: 5, step: 4, position: "Administrative Aide", rank: 5, monthlyRate: 17605, dailyRate: 799.77 },
  { grade: 5, step: 5, position: "Administrative Aide", rank: 5, monthlyRate: 17739, dailyRate: 805.86 },
  { grade: 5, step: 6, position: "Administrative Aide", rank: 5, monthlyRate: 17877, dailyRate: 812.14 },
  { grade: 5, step: 7, position: "Administrative Aide", rank: 5, monthlyRate: 18014, dailyRate: 818.36 },
  { grade: 5, step: 8, position: "Administrative Aide", rank: 5, monthlyRate: 18151, dailyRate: 824.59 },
  
  // Salary Grade 6 - Administrative Aide VI (8 steps)
  { grade: 6, step: 1, position: "Administrative Aide", rank: 6, monthlyRate: 18255, dailyRate: 829.32 },
  { grade: 6, step: 2, position: "Administrative Aide", rank: 6, monthlyRate: 18396, dailyRate: 835.73 },
  { grade: 6, step: 3, position: "Administrative Aide", rank: 6, monthlyRate: 18537, dailyRate: 842.14 },
  { grade: 6, step: 4, position: "Administrative Aide", rank: 6, monthlyRate: 18680, dailyRate: 848.64 },
  { grade: 6, step: 5, position: "Administrative Aide", rank: 6, monthlyRate: 18824, dailyRate: 855.18 },
  { grade: 6, step: 6, position: "Administrative Aide", rank: 6, monthlyRate: 18968, dailyRate: 861.73 },
  { grade: 6, step: 7, position: "Administrative Aide", rank: 6, monthlyRate: 19114, dailyRate: 868.36 },
  { grade: 6, step: 8, position: "Administrative Aide", rank: 6, monthlyRate: 19261, dailyRate: 875.05 },
  
  // Salary Grade 7 - Administrative Assistant I (8 steps)
  { grade: 7, step: 1, position: "Administrative Assistant", rank: 1, monthlyRate: 19365, dailyRate: 879.77 },
  { grade: 7, step: 2, position: "Administrative Assistant", rank: 1, monthlyRate: 19514, dailyRate: 886.55 },
  { grade: 7, step: 3, position: "Administrative Assistant", rank: 1, monthlyRate: 19663, dailyRate: 893.32 },
  { grade: 7, step: 4, position: "Administrative Assistant", rank: 1, monthlyRate: 19815, dailyRate: 900.23 },
  { grade: 7, step: 5, position: "Administrative Assistant", rank: 1, monthlyRate: 19966, dailyRate: 907.09 },
  { grade: 7, step: 6, position: "Administrative Assistant", rank: 1, monthlyRate: 20120, dailyRate: 914.09 },
  { grade: 7, step: 7, position: "Administrative Assistant", rank: 1, monthlyRate: 20274, dailyRate: 921.09 },
  { grade: 7, step: 8, position: "Administrative Assistant", rank: 1, monthlyRate: 20430, dailyRate: 928.18 },
  
  // Salary Grade 8 - Administrative Assistant II (8 steps)
  { grade: 8, step: 1, position: "Administrative Assistant", rank: 2, monthlyRate: 20534, dailyRate: 932.91 },
  { grade: 8, step: 2, position: "Administrative Assistant", rank: 2, monthlyRate: 20720, dailyRate: 941.36 },
  { grade: 8, step: 3, position: "Administrative Assistant", rank: 2, monthlyRate: 20908, dailyRate: 949.91 },
  { grade: 8, step: 4, position: "Administrative Assistant", rank: 2, monthlyRate: 21096, dailyRate: 958.45 },
  { grade: 8, step: 5, position: "Administrative Assistant", rank: 2, monthlyRate: 21287, dailyRate: 967.14 },
  { grade: 8, step: 6, position: "Administrative Assistant", rank: 2, monthlyRate: 21479, dailyRate: 975.86 },
  { grade: 8, step: 7, position: "Administrative Assistant", rank: 2, monthlyRate: 21674, dailyRate: 984.73 },
  { grade: 8, step: 8, position: "Administrative Assistant", rank: 2, monthlyRate: 21870, dailyRate: 993.64 },
  
  // Salary Grade 9 (8 steps)
  { grade: 9, step: 1, position: "Administrative Assistant", rank: 3, monthlyRate: 22219, dailyRate: 1009.50 },
  { grade: 9, step: 2, position: "Administrative Assistant", rank: 3, monthlyRate: 22404, dailyRate: 1017.91 },
  { grade: 9, step: 3, position: "Administrative Assistant", rank: 3, monthlyRate: 22591, dailyRate: 1026.41 },
  { grade: 9, step: 4, position: "Administrative Assistant", rank: 3, monthlyRate: 22780, dailyRate: 1034.09 },
  { grade: 9, step: 5, position: "Administrative Assistant", rank: 3, monthlyRate: 22971, dailyRate: 1043.23 },
  { grade: 9, step: 6, position: "Administrative Assistant", rank: 3, monthlyRate: 23162, dailyRate: 1051.91 },
  { grade: 9, step: 7, position: "Administrative Assistant", rank: 3, monthlyRate: 23356, dailyRate: 1060.73 },
  { grade: 9, step: 8, position: "Administrative Assistant", rank: 3, monthlyRate: 23551, dailyRate: 1069.59 },
  
  // Salary Grade 10 - Administrative Officer I (8 steps)
  { grade: 10, step: 1, position: "Administrative Officer", rank: 1, monthlyRate: 24381, dailyRate: 1107.77 },
  { grade: 10, step: 2, position: "Administrative Officer", rank: 1, monthlyRate: 24585, dailyRate: 1117.05 },
  { grade: 10, step: 3, position: "Administrative Officer", rank: 1, monthlyRate: 24790, dailyRate: 1126.36 },
  { grade: 10, step: 4, position: "Administrative Officer", rank: 1, monthlyRate: 24998, dailyRate: 1135.82 },
  { grade: 10, step: 5, position: "Administrative Officer", rank: 1, monthlyRate: 25207, dailyRate: 1145.32 },
  { grade: 10, step: 6, position: "Administrative Officer", rank: 1, monthlyRate: 25417, dailyRate: 1154.86 },
  { grade: 10, step: 7, position: "Administrative Officer", rank: 1, monthlyRate: 25630, dailyRate: 1164.55 },
  { grade: 10, step: 8, position: "Administrative Officer", rank: 1, monthlyRate: 25844, dailyRate: 1174.27 },
  
  // Salary Grade 11 - Administrative Officer II (8 steps)
  { grade: 11, step: 1, position: "Administrative Officer", rank: 2, monthlyRate: 28512, dailyRate: 1296.00 },
  { grade: 11, step: 2, position: "Administrative Officer", rank: 2, monthlyRate: 28796, dailyRate: 1308.91 },
  { grade: 11, step: 3, position: "Administrative Officer", rank: 2, monthlyRate: 29085, dailyRate: 1322.05 },
  { grade: 11, step: 4, position: "Administrative Officer", rank: 2, monthlyRate: 29377, dailyRate: 1335.32 },
  { grade: 11, step: 5, position: "Administrative Officer", rank: 2, monthlyRate: 29673, dailyRate: 1348.77 },
  { grade: 11, step: 6, position: "Administrative Officer", rank: 2, monthlyRate: 29974, dailyRate: 1362.45 },
  { grade: 11, step: 7, position: "Administrative Officer", rank: 2, monthlyRate: 30278, dailyRate: 1376.27 },
  { grade: 11, step: 8, position: "Administrative Officer", rank: 2, monthlyRate: 30587, dailyRate: 1390.32 },
  
  // Salary Grade 12 - Instructor I (8 steps)
  { grade: 12, step: 1, position: "Instructor", rank: 1, monthlyRate: 30705, dailyRate: 1395.68 },
  { grade: 12, step: 2, position: "Instructor", rank: 1, monthlyRate: 30989, dailyRate: 1408.59 },
  { grade: 12, step: 3, position: "Instructor", rank: 1, monthlyRate: 31277, dailyRate: 1421.68 },
  { grade: 12, step: 4, position: "Instructor", rank: 1, monthlyRate: 31568, dailyRate: 1434.91 },
  { grade: 12, step: 5, position: "Instructor", rank: 1, monthlyRate: 31863, dailyRate: 1448.32 },
  { grade: 12, step: 6, position: "Instructor", rank: 1, monthlyRate: 32162, dailyRate: 1461.91 },
  { grade: 12, step: 7, position: "Instructor", rank: 1, monthlyRate: 32464, dailyRate: 1475.64 },
  { grade: 12, step: 8, position: "Instructor", rank: 1, monthlyRate: 32770, dailyRate: 1489.55 },
  
  // Salary Grade 13 - Instructor II (8 steps)
  { grade: 13, step: 1, position: "Instructor", rank: 2, monthlyRate: 32870, dailyRate: 1494.09 },
  { grade: 13, step: 2, position: "Instructor", rank: 2, monthlyRate: 33183, dailyRate: 1508.32 },
  { grade: 13, step: 3, position: "Instructor", rank: 2, monthlyRate: 33499, dailyRate: 1522.68 },
  { grade: 13, step: 4, position: "Instructor", rank: 2, monthlyRate: 33819, dailyRate: 1537.23 },
  { grade: 13, step: 5, position: "Instructor", rank: 2, monthlyRate: 34144, dailyRate: 1551.91 },
  { grade: 13, step: 6, position: "Instructor", rank: 2, monthlyRate: 34472, dailyRate: 1566.82 },
  { grade: 13, step: 7, position: "Instructor", rank: 2, monthlyRate: 34804, dailyRate: 1581.91 },
  { grade: 13, step: 8, position: "Instructor", rank: 2, monthlyRate: 35141, dailyRate: 1597.32 },
  
  // Salary Grade 14 - Instructor III (8 steps)
  { grade: 14, step: 1, position: "Instructor", rank: 3, monthlyRate: 35434, dailyRate: 1610.64 },
  { grade: 14, step: 2, position: "Instructor", rank: 3, monthlyRate: 35794, dailyRate: 1627.00 },
  { grade: 14, step: 3, position: "Instructor", rank: 3, monthlyRate: 36158, dailyRate: 1643.55 },
  { grade: 14, step: 4, position: "Instructor", rank: 3, monthlyRate: 36528, dailyRate: 1660.36 },
  { grade: 14, step: 5, position: "Instructor", rank: 3, monthlyRate: 36900, dailyRate: 1677.27 },
  { grade: 14, step: 6, position: "Instructor", rank: 3, monthlyRate: 37278, dailyRate: 1694.45 },
  { grade: 14, step: 7, position: "Instructor", rank: 3, monthlyRate: 37662, dailyRate: 1711.91 },
  { grade: 14, step: 8, position: "Instructor", rank: 3, monthlyRate: 38049, dailyRate: 1729.50 },
  
  // Salary Grade 15 - Assistant Professor I (8 steps)
  { grade: 15, step: 1, position: "Assistant Professor", rank: 1, monthlyRate: 38413, dailyRate: 1746.05 },
  { grade: 15, step: 2, position: "Assistant Professor", rank: 1, monthlyRate: 38810, dailyRate: 1764.09 },
  { grade: 15, step: 3, position: "Assistant Professor", rank: 1, monthlyRate: 39212, dailyRate: 1782.36 },
  { grade: 15, step: 4, position: "Assistant Professor", rank: 1, monthlyRate: 39619, dailyRate: 1800.86 },
  { grade: 15, step: 5, position: "Assistant Professor", rank: 1, monthlyRate: 40030, dailyRate: 1819.55 },
  { grade: 15, step: 6, position: "Assistant Professor", rank: 1, monthlyRate: 40446, dailyRate: 1838.45 },
  { grade: 15, step: 7, position: "Assistant Professor", rank: 1, monthlyRate: 40868, dailyRate: 1857.64 },
  { grade: 15, step: 8, position: "Assistant Professor", rank: 1, monthlyRate: 41296, dailyRate: 1877.09 },
  
  // Salary Grade 16 - Assistant Professor II (8 steps)
  { grade: 16, step: 1, position: "Assistant Professor", rank: 2, monthlyRate: 41616, dailyRate: 1891.64 },
  { grade: 16, step: 2, position: "Assistant Professor", rank: 2, monthlyRate: 42052, dailyRate: 1911.45 },
  { grade: 16, step: 3, position: "Assistant Professor", rank: 2, monthlyRate: 42494, dailyRate: 1931.55 },
  { grade: 16, step: 4, position: "Assistant Professor", rank: 2, monthlyRate: 42941, dailyRate: 1951.86 },
  { grade: 16, step: 5, position: "Assistant Professor", rank: 2, monthlyRate: 43394, dailyRate: 1972.45 },
  { grade: 16, step: 6, position: "Assistant Professor", rank: 2, monthlyRate: 43852, dailyRate: 1993.27 },
  { grade: 16, step: 7, position: "Assistant Professor", rank: 2, monthlyRate: 44317, dailyRate: 2014.41 },
  { grade: 16, step: 8, position: "Assistant Professor", rank: 2, monthlyRate: 44786, dailyRate: 2035.73 },
  
  // Salary Grade 17 - Assistant Professor III (8 steps)
  { grade: 17, step: 1, position: "Assistant Professor", rank: 3, monthlyRate: 45138, dailyRate: 2051.73 },
  { grade: 17, step: 2, position: "Assistant Professor", rank: 3, monthlyRate: 45619, dailyRate: 2073.59 },
  { grade: 17, step: 3, position: "Assistant Professor", rank: 3, monthlyRate: 46105, dailyRate: 2095.68 },
  { grade: 17, step: 4, position: "Assistant Professor", rank: 3, monthlyRate: 46597, dailyRate: 2118.05 },
  { grade: 17, step: 5, position: "Assistant Professor", rank: 3, monthlyRate: 47095, dailyRate: 2140.68 },
  { grade: 17, step: 6, position: "Assistant Professor", rank: 3, monthlyRate: 47599, dailyRate: 2163.59 },
  { grade: 17, step: 7, position: "Assistant Professor", rank: 3, monthlyRate: 48109, dailyRate: 2186.77 },
  { grade: 17, step: 8, position: "Assistant Professor", rank: 3, monthlyRate: 48626, dailyRate: 2210.27 },
  
  // Salary Grade 18 - Assistant Professor IV (8 steps)
  { grade: 18, step: 1, position: "Assistant Professor", rank: 4, monthlyRate: 49015, dailyRate: 2228.41 },
  { grade: 18, step: 2, position: "Assistant Professor", rank: 4, monthlyRate: 49542, dailyRate: 2252.36 },
  { grade: 18, step: 3, position: "Assistant Professor", rank: 4, monthlyRate: 50077, dailyRate: 2276.68 },
  { grade: 18, step: 4, position: "Assistant Professor", rank: 4, monthlyRate: 50617, dailyRate: 2301.23 },
  { grade: 18, step: 5, position: "Assistant Professor", rank: 4, monthlyRate: 51166, dailyRate: 2326.18 },
  { grade: 18, step: 6, position: "Assistant Professor", rank: 4, monthlyRate: 51721, dailyRate: 2351.41 },
  { grade: 18, step: 7, position: "Assistant Professor", rank: 4, monthlyRate: 52282, dailyRate: 2376.91 },
  { grade: 18, step: 8, position: "Assistant Professor", rank: 4, monthlyRate: 52851, dailyRate: 2402.77 },
  
  // Salary Grade 19 - Associate Professor I (8 steps)
  { grade: 19, step: 1, position: "Associate Professor", rank: 1, monthlyRate: 53873, dailyRate: 2449.23 },
  { grade: 19, step: 2, position: "Associate Professor", rank: 1, monthlyRate: 54649, dailyRate: 2484.50 },
  { grade: 19, step: 3, position: "Associate Professor", rank: 1, monthlyRate: 55437, dailyRate: 2520.32 },
  { grade: 19, step: 4, position: "Associate Professor", rank: 1, monthlyRate: 56237, dailyRate: 2556.68 },
  { grade: 19, step: 5, position: "Associate Professor", rank: 1, monthlyRate: 57051, dailyRate: 2593.68 },
  { grade: 19, step: 6, position: "Associate Professor", rank: 1, monthlyRate: 57878, dailyRate: 2631.27 },
  { grade: 19, step: 7, position: "Associate Professor", rank: 1, monthlyRate: 58719, dailyRate: 2669.50 },
  { grade: 19, step: 8, position: "Associate Professor", rank: 1, monthlyRate: 59573, dailyRate: 2708.32 },
  
  // Salary Grade 20 - Associate Professor II (8 steps)
  { grade: 20, step: 1, position: "Associate Professor", rank: 2, monthlyRate: 60157, dailyRate: 2734.86 },
  { grade: 20, step: 2, position: "Associate Professor", rank: 2, monthlyRate: 61032, dailyRate: 2774.64 },
  { grade: 20, step: 3, position: "Associate Professor", rank: 2, monthlyRate: 61922, dailyRate: 2815.09 },
  { grade: 20, step: 4, position: "Associate Professor", rank: 2, monthlyRate: 62827, dailyRate: 2856.23 },
  { grade: 20, step: 5, position: "Associate Professor", rank: 2, monthlyRate: 63747, dailyRate: 2898.05 },
  { grade: 20, step: 6, position: "Associate Professor", rank: 2, monthlyRate: 64669, dailyRate: 2939.95 },
  { grade: 20, step: 7, position: "Associate Professor", rank: 2, monthlyRate: 65599, dailyRate: 2982.23 },
  { grade: 20, step: 8, position: "Associate Professor", rank: 2, monthlyRate: 66532, dailyRate: 3024.64 },
  
  // Salary Grade 21 - Associate Professor III (8 steps)
  { grade: 21, step: 1, position: "Associate Professor", rank: 3, monthlyRate: 67005, dailyRate: 3046.14 },
  { grade: 21, step: 2, position: "Associate Professor", rank: 3, monthlyRate: 67992, dailyRate: 3091.00 },
  { grade: 21, step: 3, position: "Associate Professor", rank: 3, monthlyRate: 68996, dailyRate: 3136.64 },
  { grade: 21, step: 4, position: "Associate Professor", rank: 3, monthlyRate: 70016, dailyRate: 3183.45 },
  { grade: 21, step: 5, position: "Associate Professor", rank: 3, monthlyRate: 71054, dailyRate: 3230.64 },
  { grade: 21, step: 6, position: "Associate Professor", rank: 3, monthlyRate: 72107, dailyRate: 3278.50 },
  { grade: 21, step: 7, position: "Associate Professor", rank: 3, monthlyRate: 73143, dailyRate: 3325.59 },
  { grade: 21, step: 8, position: "Associate Professor", rank: 3, monthlyRate: 74231, dailyRate: 3374.14 },
  
  // Salary Grade 22 - Associate Professor IV (8 steps)
  { grade: 22, step: 1, position: "Associate Professor", rank: 4, monthlyRate: 74836, dailyRate: 3401.64 },
  { grade: 22, step: 2, position: "Associate Professor", rank: 4, monthlyRate: 75952, dailyRate: 3452.36 },
  { grade: 22, step: 3, position: "Associate Professor", rank: 4, monthlyRate: 77086, dailyRate: 3503.91 },
  { grade: 22, step: 4, position: "Associate Professor", rank: 4, monthlyRate: 78238, dailyRate: 3556.27 },
  { grade: 22, step: 5, position: "Associate Professor", rank: 4, monthlyRate: 79409, dailyRate: 3609.50 },
  { grade: 22, step: 6, position: "Associate Professor", rank: 4, monthlyRate: 80562, dailyRate: 3661.91 },
  { grade: 22, step: 7, position: "Associate Professor", rank: 4, monthlyRate: 81771, dailyRate: 3717.32 },
  { grade: 22, step: 8, position: "Associate Professor", rank: 4, monthlyRate: 82999, dailyRate: 3773.14 },
  
  // Salary Grade 23 - Associate Professor V (8 steps)
  { grade: 23, step: 1, position: "Associate Professor", rank: 5, monthlyRate: 83659, dailyRate: 3803.14 },
  { grade: 23, step: 2, position: "Associate Professor", rank: 5, monthlyRate: 84918, dailyRate: 3860.36 },
  { grade: 23, step: 3, position: "Associate Professor", rank: 5, monthlyRate: 86199, dailyRate: 3918.59 },
  { grade: 23, step: 4, position: "Associate Professor", rank: 5, monthlyRate: 87507, dailyRate: 3978.05 },
  { grade: 23, step: 5, position: "Associate Professor", rank: 5, monthlyRate: 88836, dailyRate: 4038.45 },
  { grade: 23, step: 6, position: "Associate Professor", rank: 5, monthlyRate: 90387, dailyRate: 4108.95 },
  { grade: 23, step: 7, position: "Associate Professor", rank: 5, monthlyRate: 91862, dailyRate: 4176.00 },
  { grade: 23, step: 8, position: "Associate Professor", rank: 5, monthlyRate: 93299, dailyRate: 4241.32 },
  
  // Salary Grade 24 - Professor I (8 steps)
  { grade: 24, step: 1, position: "Professor", rank: 1, monthlyRate: 94132, dailyRate: 4279.18 },
  { grade: 24, step: 2, position: "Professor", rank: 1, monthlyRate: 95668, dailyRate: 4349.00 },
  { grade: 24, step: 3, position: "Professor", rank: 1, monthlyRate: 97230, dailyRate: 4420.00 },
  { grade: 24, step: 4, position: "Professor", rank: 1, monthlyRate: 98817, dailyRate: 4492.14 },
  { grade: 24, step: 5, position: "Professor", rank: 1, monthlyRate: 100430, dailyRate: 4565.45 },
  { grade: 24, step: 6, position: "Professor", rank: 1, monthlyRate: 102069, dailyRate: 4640.00 },
  { grade: 24, step: 7, position: "Professor", rank: 1, monthlyRate: 103685, dailyRate: 4713.41 },
  { grade: 24, step: 8, position: "Professor", rank: 1, monthlyRate: 105378, dailyRate: 4790.36 },
  
  // Salary Grade 25 - Professor II (8 steps)
  { grade: 25, step: 1, position: "Professor", rank: 2, monthlyRate: 107208, dailyRate: 4873.09 },
  { grade: 25, step: 2, position: "Professor", rank: 2, monthlyRate: 108958, dailyRate: 4952.64 },
  { grade: 25, step: 3, position: "Professor", rank: 2, monthlyRate: 110736, dailyRate: 5033.45 },
  { grade: 25, step: 4, position: "Professor", rank: 2, monthlyRate: 112543, dailyRate: 5115.59 },
  { grade: 25, step: 5, position: "Professor", rank: 2, monthlyRate: 114381, dailyRate: 5199.14 },
  { grade: 25, step: 6, position: "Professor", rank: 2, monthlyRate: 116247, dailyRate: 5284.00 },
  { grade: 25, step: 7, position: "Professor", rank: 2, monthlyRate: 118145, dailyRate: 5370.23 },
  { grade: 25, step: 8, position: "Professor", rank: 2, monthlyRate: 120073, dailyRate: 5457.86 },
  
  // Salary Grade 26 - Professor III (8 steps)
  { grade: 26, step: 1, position: "Professor", rank: 3, monthlyRate: 121146, dailyRate: 5506.64 },
  { grade: 26, step: 2, position: "Professor", rank: 3, monthlyRate: 123122, dailyRate: 5596.45 },
  { grade: 26, step: 3, position: "Professor", rank: 3, monthlyRate: 125132, dailyRate: 5687.82 },
  { grade: 26, step: 4, position: "Professor", rank: 3, monthlyRate: 127174, dailyRate: 5780.64 },
  { grade: 26, step: 5, position: "Professor", rank: 3, monthlyRate: 129250, dailyRate: 5875.00 },
  { grade: 26, step: 6, position: "Professor", rank: 3, monthlyRate: 131359, dailyRate: 5970.86 },
  { grade: 26, step: 7, position: "Professor", rank: 3, monthlyRate: 133503, dailyRate: 6068.32 },
  { grade: 26, step: 8, position: "Professor", rank: 3, monthlyRate: 135682, dailyRate: 6167.36 },
  
  // Salary Grade 27 - Professor IV (8 steps)
  { grade: 27, step: 1, position: "Professor", rank: 4, monthlyRate: 136893, dailyRate: 6222.41 },
  { grade: 27, step: 2, position: "Professor", rank: 4, monthlyRate: 139128, dailyRate: 6324.00 },
  { grade: 27, step: 3, position: "Professor", rank: 4, monthlyRate: 141399, dailyRate: 6427.23 },
  { grade: 27, step: 4, position: "Professor", rank: 4, monthlyRate: 143638, dailyRate: 6529.00 },
  { grade: 27, step: 5, position: "Professor", rank: 4, monthlyRate: 145983, dailyRate: 6635.59 },
  { grade: 27, step: 6, position: "Professor", rank: 4, monthlyRate: 148080, dailyRate: 6730.91 },
  { grade: 27, step: 7, position: "Professor", rank: 4, monthlyRate: 150498, dailyRate: 6840.82 },
  { grade: 27, step: 8, position: "Professor", rank: 4, monthlyRate: 152954, dailyRate: 6952.45 },
  
  // Salary Grade 28 - Professor V (8 steps)
  { grade: 28, step: 1, position: "Professor", rank: 5, monthlyRate: 154320, dailyRate: 7014.55 },
  { grade: 28, step: 2, position: "Professor", rank: 5, monthlyRate: 156838, dailyRate: 7129.00 },
  { grade: 28, step: 3, position: "Professor", rank: 5, monthlyRate: 159398, dailyRate: 7245.36 },
  { grade: 28, step: 4, position: "Professor", rank: 5, monthlyRate: 161845, dailyRate: 7356.59 },
  { grade: 28, step: 5, position: "Professor", rank: 5, monthlyRate: 164485, dailyRate: 7476.59 },
  { grade: 28, step: 6, position: "Professor", rank: 5, monthlyRate: 167171, dailyRate: 7598.68 },
  { grade: 28, step: 7, position: "Professor", rank: 5, monthlyRate: 169654, dailyRate: 7711.55 },
  { grade: 28, step: 8, position: "Professor", rank: 5, monthlyRate: 172423, dailyRate: 7837.41 },
  
  // Salary Grade 29 - Professor VI (8 steps)
  { grade: 29, step: 1, position: "Professor", rank: 6, monthlyRate: 173962, dailyRate: 7907.36 },
  { grade: 29, step: 2, position: "Professor", rank: 6, monthlyRate: 176802, dailyRate: 8036.45 },
  { grade: 29, step: 3, position: "Professor", rank: 6, monthlyRate: 179688, dailyRate: 8167.64 },
  { grade: 29, step: 4, position: "Professor", rank: 6, monthlyRate: 182621, dailyRate: 8301.00 },
  { grade: 29, step: 5, position: "Professor", rank: 6, monthlyRate: 185601, dailyRate: 8436.41 },
  { grade: 29, step: 6, position: "Professor", rank: 6, monthlyRate: 188267, dailyRate: 8557.59 },
  { grade: 29, step: 7, position: "Professor", rank: 6, monthlyRate: 191340, dailyRate: 8697.27 },
  { grade: 29, step: 8, position: "Professor", rank: 6, monthlyRate: 194463, dailyRate: 8839.23 },
]

async function seedSalaryGrades() {
  console.log('🌱 Seeding salary grades...')
  
  try {
    // Clear existing salary grades
    await prisma.salaryGrade.deleteMany({})
    console.log('  ✓ Cleared existing salary grades')
    
    // Insert new salary grades with steps
    for (const data of salaryGradesData) {
      // Convert rank to Roman numeral for display
      const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
      const rankLabel = romanNumerals[data.rank] || data.rank.toString()
      const positionLabel = `${data.position} ${rankLabel}`
      const description = `${positionLabel} - SG ${data.grade} - ${data.step} (₱${data.monthlyRate.toLocaleString()}/month)`
      
      await prisma.salaryGrade.create({
        data: {
          grade: data.grade,
          step: data.step,
          position: data.position,
          rank: data.rank,
          monthlyRate: data.monthlyRate,
          dailyRate: data.dailyRate,
          description,
          isActive: true,
          effectiveDate: new Date(),
        },
      })
      
      console.log(`  ✓ Created: ${description}`)
    }
    
    console.log(`\n✅ Successfully seeded ${salaryGradesData.length} salary grades`)
  } catch (error) {
    console.error('❌ Error seeding salary grades:', error)
    throw error
  }
}

async function main() {
  await seedSalaryGrades()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
