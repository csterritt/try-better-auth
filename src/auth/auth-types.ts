/**
 * Type definitions for authentication related functionality
 */

/**
 * OTP setup data structure stored in encrypted cookie
 * Contains timestamp of when OTP was created and number of verification attempts
 */
export type OtpSetupData = {
  time: number
  codeAttempts: number
}

/**
 * Form data type for request body parsing
 */
export type FormDataType = {
  [key: string]: string | undefined | File
}
