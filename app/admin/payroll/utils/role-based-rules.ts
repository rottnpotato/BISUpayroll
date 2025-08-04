import { PayrollRole, UserPayrollRole, PayrollRule } from '../types'

export interface RoleBasedPayrollContext {
  userId: string
  userRoles: PayrollRole[]
  baseSalary: number
  hoursWorked: number
  overtimeHours: number
  nightHours: number
  holidayHours: number
  isHoliday: boolean
  holidayType: 'regular' | 'special'
}

export interface ApplicableRule {
  rule: PayrollRule
  isApplicable: boolean
  reason: string
  roleRestrictions: string[]
}

/**
 * Determines which payroll rules apply to a user based on their assigned roles
 */
export function getApplicableRulesForUser(
  context: RoleBasedPayrollContext,
  allRules: PayrollRule[]
): ApplicableRule[] {
  const applicableRules: ApplicableRule[] = []

  for (const rule of allRules) {
    const applicableRule: ApplicableRule = {
      rule,
      isApplicable: false,
      reason: '',
      roleRestrictions: []
    }

    // Check if rule applies to all users or if user has specific assignment
    if (rule.applyToAll) {
      // Check role-based eligibility
      const eligibilityCheck = checkRoleBasedEligibility(rule, context.userRoles)
      applicableRule.isApplicable = eligibilityCheck.isEligible
      applicableRule.reason = eligibilityCheck.reason
      applicableRule.roleRestrictions = eligibilityCheck.restrictions
    } else {
      // Check if user has specific rule assignment
      const hasDirectAssignment = rule.assignedUsers?.some(
        assignment => assignment.userId === context.userId
      )
      
      if (hasDirectAssignment) {
        const eligibilityCheck = checkRoleBasedEligibility(rule, context.userRoles)
        applicableRule.isApplicable = eligibilityCheck.isEligible
        applicableRule.reason = eligibilityCheck.reason || 'Directly assigned to user'
        applicableRule.roleRestrictions = eligibilityCheck.restrictions
      } else {
        applicableRule.reason = 'Not assigned to user and does not apply to all'
      }
    }

    applicableRules.push(applicableRule)
  }

  return applicableRules
}

/**
 * Checks if a payroll rule is eligible based on user's roles
 */
function checkRoleBasedEligibility(rule: PayrollRule, userRoles: PayrollRole[]): {
  isEligible: boolean
  reason: string
  restrictions: string[]
} {
  if (!userRoles || userRoles.length === 0) {
    return {
      isEligible: true, // Default to eligible if no roles assigned
      reason: 'No roles assigned - using default eligibility',
      restrictions: []
    }
  }

  const activeRoles = userRoles.filter(role => role.isActive)
  
  if (activeRoles.length === 0) {
    return {
      isEligible: false,
      reason: 'All assigned roles are inactive',
      restrictions: ['All roles inactive']
    }
  }

  const restrictions: string[] = []
  let hasEligibleRole = false

  // Check eligibility based on rule category/type
  for (const role of activeRoles) {
    let isRoleEligible = true
    const roleRestrictions: string[] = []

    switch (rule.category) {
      case 'overtime':
        if (!role.overtimeEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: Overtime not eligible`)
        }
        break
      
      case 'differential':
        if (rule.name.toLowerCase().includes('night') && !role.nightDifferentialEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: Night differential not eligible`)
        }
        break
      
      case 'holiday_pay':
        if (!role.holidayPayEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: Holiday pay not eligible`)
        }
        break
      
      case 'mandatory_contribution':
        if (rule.name.toLowerCase().includes('gsis') && !role.gsisEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: GSIS not eligible`)
        }
        if (rule.name.toLowerCase().includes('philhealth') && !role.philHealthEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: PhilHealth not eligible`)
        }
        if (rule.name.toLowerCase().includes('pag-ibig') && !role.pagibigEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: Pag-IBIG not eligible`)
        }
        break
      
      case 'tax':
        if (!role.withholdingTaxEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: Withholding tax not eligible`)
        }
        break
      
      case 'mandatory_benefit':
        if (rule.name.toLowerCase().includes('13th month') && !role.thirteenthMonthEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: 13th month pay not eligible`)
        }
        break
      
      case 'leave_benefit':
        if (!role.leaveEligible) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: Leave benefits not eligible`)
        }
        break
      
      default:
        // For rules without specific category, check if role is active
        if (!role.isActive) {
          isRoleEligible = false
          roleRestrictions.push(`${role.name}: Role is inactive`)
        }
        break
    }

    if (isRoleEligible) {
      hasEligibleRole = true
    } else {
      restrictions.push(...roleRestrictions)
    }
  }

  return {
    isEligible: hasEligibleRole,
    reason: hasEligibleRole 
      ? `Eligible through ${activeRoles.find(r => r.isActive)?.name || 'active role'}`
      : 'No eligible roles found',
    restrictions
  }
}

/**
 * Calculates role-based base salary
 */
export function calculateRoleBasedSalary(userRoles: PayrollRole[]): number {
  if (!userRoles || userRoles.length === 0) {
    return 0
  }

  const activeRoles = userRoles.filter(role => role.isActive && role.baseSalary)
  
  if (activeRoles.length === 0) {
    return 0
  }

  // Use the highest base salary from active roles
  return Math.max(...activeRoles.map(role => role.baseSalary || 0))
}

/**
 * Gets all eligible roles for payroll rule categories
 */
export function getRoleEligibilityMatrix(userRoles: PayrollRole[]): Record<string, boolean> {
  if (!userRoles || userRoles.length === 0) {
    return {}
  }

  const activeRoles = userRoles.filter(role => role.isActive)
  
  return {
    overtime: activeRoles.some(role => role.overtimeEligible),
    nightDifferential: activeRoles.some(role => role.nightDifferentialEligible),
    holidayPay: activeRoles.some(role => role.holidayPayEligible),
    gsis: activeRoles.some(role => role.gsisEligible),
    philHealth: activeRoles.some(role => role.philHealthEligible),
    pagibig: activeRoles.some(role => role.pagibigEligible),
    withholdingTax: activeRoles.some(role => role.withholdingTaxEligible),
    thirteenthMonth: activeRoles.some(role => role.thirteenthMonthEligible),
    leave: activeRoles.some(role => role.leaveEligible)
  }
}

/**
 * Validates role configuration for potential conflicts
 */
export function validateRoleConfiguration(roles: PayrollRole[]): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  // Check for duplicate role names
  const roleNames = roles.map(role => role.name)
  const duplicateNames = roleNames.filter((name, index) => roleNames.indexOf(name) !== index)
  
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate role names found: ${[...new Set(duplicateNames)].join(', ')}`)
  }

  // Check for roles without users
  const rolesWithoutUsers = roles.filter(role => 
    role.isActive && (!role.userRoles || role.userRoles.length === 0)
  )
  
  if (rolesWithoutUsers.length > 0) {
    warnings.push(`Active roles without assigned users: ${rolesWithoutUsers.map(r => r.name).join(', ')}`)
  }

  // Check for roles with no base salary
  const rolesWithoutSalary = roles.filter(role => 
    role.isActive && !role.baseSalary
  )
  
  if (rolesWithoutSalary.length > 0) {
    warnings.push(`Active roles without base salary: ${rolesWithoutSalary.map(r => r.name).join(', ')}`)
  }

  // Check for overly restrictive roles
  const restrictiveRoles = roles.filter(role => {
    const eligibilityCount = [
      role.overtimeEligible,
      role.nightDifferentialEligible,
      role.holidayPayEligible,
      role.gsisEligible,
      role.philHealthEligible,
      role.pagibigEligible,
      role.withholdingTaxEligible,
      role.thirteenthMonthEligible,
      role.leaveEligible
    ].filter(Boolean).length
    
    return role.isActive && eligibilityCount < 3
  })
  
  if (restrictiveRoles.length > 0) {
    warnings.push(`Potentially restrictive roles (few eligible benefits): ${restrictiveRoles.map(r => r.name).join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  }
}