import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16

// Get encryption key from environment or generate one
const getEncryptionKey = (salt: Buffer): Buffer => {
  const secret = process.env.PAYROLL_ENCRYPTION_SECRET || 'default-secret-key-change-in-production'
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512')
}

export interface EncryptionResult {
  encryptedFilePath: string
  metadata: {
    originalFileName: string
    fileSize: number
    encryptedAt: Date
    checksum: string
  }
}

export interface DecryptionResult {
  decryptedFilePath: string
  originalFileName: string
  checksum: string
}

/**
 * Encrypts a file and saves it to the secure payroll files directory
 */
export async function encryptPayrollFile(
  filePath: string,
  originalFileName: string,
  payrollPeriod: { start: Date; end: Date },
  department?: string
): Promise<EncryptionResult> {
  try {
    // Create secure directory structure
    const baseDir = path.join(process.cwd(), 'secure-payroll-files')
    const yearMonth = `${payrollPeriod.start.getFullYear()}-${(payrollPeriod.start.getMonth() + 1).toString().padStart(2, '0')}`
    const departmentDir = department ? path.join(baseDir, yearMonth, department) : path.join(baseDir, yearMonth, 'all-departments')
    
    // Ensure directory exists
    await fs.promises.mkdir(departmentDir, { recursive: true })

    // Read the original file
    const fileBuffer = await fs.promises.readFile(filePath)
    
    // Generate salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = getEncryptionKey(salt)

    // Create cipher (use createCipheriv for AES-GCM)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    cipher.setAAD(Buffer.from(originalFileName, 'utf8'))

    // Encrypt the file
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ])

    // Get authentication tag
    const tag = cipher.getAuthTag()

    // Create final encrypted file with metadata
    const encryptedFileData = Buffer.concat([
      salt,           // 64 bytes
      iv,             // 16 bytes  
      tag,            // 16 bytes
      encrypted       // variable length
    ])

    // Generate encrypted filename
    const timestamp = Date.now()
    const randomSuffix = crypto.randomBytes(8).toString('hex')
    const encryptedFileName = `payroll_${timestamp}_${randomSuffix}.enc`
    const encryptedFilePath = path.join(departmentDir, encryptedFileName)

    // Write encrypted file
    await fs.promises.writeFile(encryptedFilePath, encryptedFileData)

    // Generate checksum of original file
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    // Clean up original file if it's a temporary file
    if (filePath.includes('tmp') || filePath.includes('temp')) {
      await fs.promises.unlink(filePath)
    }

    return {
      encryptedFilePath,
      metadata: {
        originalFileName,
        fileSize: fileBuffer.length,
        encryptedAt: new Date(),
        checksum
      }
    }
  } catch (error) {
    console.error('Error encrypting payroll file:', error)
    throw new Error(`Failed to encrypt payroll file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypts a payroll file for viewing or printing
 */
export async function decryptPayrollFile(
  encryptedFilePath: string,
  originalFileName: string,
  outputDir?: string
): Promise<DecryptionResult> {
  try {
    // Default output directory for temporary decrypted files
    const tempDir = outputDir || path.join(process.cwd(), 'temp-decrypted')
    await fs.promises.mkdir(tempDir, { recursive: true })

    // Read encrypted file
    const encryptedFileData = await fs.promises.readFile(encryptedFilePath)

    // Extract components
    const salt = encryptedFileData.subarray(0, SALT_LENGTH)
    const iv = encryptedFileData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = encryptedFileData.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = encryptedFileData.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    // Generate key
    const key = getEncryptionKey(salt)

    // Create decipher (use createDecipheriv for AES-GCM)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAAD(Buffer.from(originalFileName, 'utf8'))
    decipher.setAuthTag(tag)

    // Decrypt the file
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])

    // Generate checksum
    const checksum = crypto.createHash('sha256').update(decrypted).digest('hex')

    // Create temporary decrypted file
    const timestamp = Date.now()
    const decryptedFileName = `${timestamp}_${originalFileName}`
    const decryptedFilePath = path.join(tempDir, decryptedFileName)

    await fs.promises.writeFile(decryptedFilePath, decrypted)

    return {
      decryptedFilePath,
      originalFileName,
      checksum
    }
  } catch (error) {
    console.error('Error decrypting payroll file:', error)
    throw new Error(`Failed to decrypt payroll file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Cleans up temporary decrypted files (should be called after viewing/printing)
 */
export async function cleanupDecryptedFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath)
  } catch (error) {
    console.error('Error cleaning up decrypted file:', error)
    // Don't throw error for cleanup failures
  }
}

/**
 * Verifies file integrity using checksum
 */
export function verifyFileIntegrity(fileBuffer: Buffer, expectedChecksum: string): boolean {
  const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex')
  return actualChecksum === expectedChecksum
}

/**
 * Creates secure directory structure for payroll files
 */
export async function createSecureDirectory(
  payrollPeriod: { start: Date; end: Date },
  department?: string
): Promise<string> {
  const baseDir = path.join(process.cwd(), 'secure-payroll-files')
  const yearMonth = `${payrollPeriod.start.getFullYear()}-${(payrollPeriod.start.getMonth() + 1).toString().padStart(2, '0')}`
  const departmentDir = department ? path.join(baseDir, yearMonth, department) : path.join(baseDir, yearMonth, 'all-departments')
  
  await fs.promises.mkdir(departmentDir, { recursive: true })
  return departmentDir
}