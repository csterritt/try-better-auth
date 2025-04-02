import crypto from 'crypto'

/**
 * Encrypts a string using AES-256-GCM with the provided key
 * @param text - Text to encrypt
 * @param key - Encryption key
 * @returns Encrypted text as a base64 string
 */
export const encrypt = (text: string, key: string): string => {
  // Check if key is defined
  if (!key) {
    throw new Error('Encryption key is undefined or empty')
  }

  // Check if text is defined
  if (!text) {
    throw new Error('Text to encrypt is undefined or empty')
  }
  
  // Create a buffer from the key (must be 32 bytes for AES-256)
  const keyBuffer = crypto.createHash('sha256').update(key).digest()
  
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16)
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv)
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  // Get the auth tag
  const authTag = cipher.getAuthTag()
  
  // Combine IV, encrypted text, and auth tag into a single string
  // Format: base64(iv):base64(authTag):base64(encryptedText)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypts a string that was encrypted using AES-256-GCM
 * @param encryptedText - Text to decrypt (in the format iv:authTag:encryptedText)
 * @param key - Decryption key (same as encryption key)
 * @returns Decrypted text or null if decryption fails
 */
export const decrypt = (encryptedText: string, key: string): string | null => {
  try {
    // Check if key is defined
    if (!key) {
      throw new Error('Decryption key is undefined or empty')
    }

    // Check if encryptedText is defined
    if (!encryptedText) {
      throw new Error('Encrypted text is undefined or empty')
    }
    
    // Split the encrypted text into its components
    const [ivBase64, authTagBase64, encryptedBase64] = encryptedText.split(':')
    
    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
      return null
    }
    
    // Convert components from base64 to buffers
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')
    
    // Create a buffer from the key (must be 32 bytes for AES-256)
    const keyBuffer = crypto.createHash('sha256').update(key).digest()
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}
