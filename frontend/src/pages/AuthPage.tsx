import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Phone, Shield, ArrowRight, Loader2 } from 'lucide-react'

import { RootState, AppDispatch } from '../store/store'
import { sendOtp, verifyOtp, clearError } from '../store/slices/authSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'

// Validation schemas
const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
})

const otpSchema = z.object({
  otp: z
    .string()
    .length(4, 'OTP must be exactly 4 digits')
    .regex(/^\d{4}$/, 'OTP must contain only numbers')
})

type PhoneFormData = z.infer<typeof phoneSchema>
type OtpFormData = z.infer<typeof otpSchema>

const AuthPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, otpSent, otpLoading, phoneNumber, error } = useSelector(
    (state: RootState) => state.auth
  )
  const { profile } = useSelector((state: RootState) => state.profile)

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [countdown, setCountdown] = useState(0)

  // Phone form
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: ''
    }
  })

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(profile ? '/dashboard' : '/profile-setup')
    }
  }, [isAuthenticated, profile, navigate])

  // Handle OTP sent state
  useEffect(() => {
    if (otpSent && phoneNumber) {
      setStep('otp')
      setCountdown(300) // 5 minutes
      toast.success('OTP sent successfully!')
    }
  }, [otpSent, phoneNumber])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Clear errors when switching steps
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    try {
      await dispatch(sendOtp(data.phoneNumber)).unwrap()
    } catch (error) {
      // Error is handled by the error effect above
    }
  }

  const handleOtpSubmit = async (data: OtpFormData) => {
    if (!phoneNumber) return

    try {
      await dispatch(verifyOtp({ phoneNumber, otp: data.otp })).unwrap()
      toast.success('Authentication successful!')
    } catch (error) {
      // Error is handled by the error effect above
      otpForm.reset()
    }
  }

  const handleResendOtp = async () => {
    if (!phoneNumber || countdown > 0) return

    try {
      await dispatch(sendOtp(phoneNumber)).unwrap()
      setCountdown(300)
      toast.success('OTP resent successfully!')
    } catch (error) {
      // Error is handled by the error effect above
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setCountdown(0)
    otpForm.reset()
    phoneForm.reset()
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark cyber-grid">
      <div className="card-cyber-glow max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-cyber text-gradient mb-2">
            GameVerse
          </h1>
          <p className="text-cyber-gray-300 text-lg">
            Enter the cyberpunk gaming universe
          </p>
          {step === 'otp' && (
            <div className="mt-4 p-3 bg-cyber-darker rounded-lg border border-cyber-primary">
              <p className="text-sm text-cyber-light">
                Code sent to: <span className="text-cyber-primary font-mono">{phoneNumber}</span>
              </p>
            </div>
          )}
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-6">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-cyber-light mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Phone Number
              </label>
              <input
                {...phoneForm.register('phoneNumber')}
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="input-cyber"
                disabled={otpLoading}
              />
              {phoneForm.formState.errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-400">
                  {phoneForm.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              className="btn-cyber w-full flex items-center justify-center"
            >
              {otpLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Send OTP
            </button>

            <div className="text-center">
              <p className="text-xs text-cyber-gray-400">
                We'll send you a 4-digit verification code
              </p>
              <p className="text-xs text-cyber-gray-500 mt-1">
                Dev mode: Use OTP "1234" for any number
              </p>
            </div>
          </form>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-cyber-light mb-2">
                <Shield className="inline w-4 h-4 mr-2" />
                Verification Code
              </label>
              <input
                {...otpForm.register('otp')}
                id="otp"
                type="text"
                placeholder="1234"
                maxLength={4}
                className="input-cyber text-center text-2xl font-mono tracking-widest"
                disabled={isLoading}
                autoFocus
              />
              {otpForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-400">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-cyber w-full flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Verify & Enter
            </button>

            {/* Countdown and Resend */}
            <div className="text-center space-y-2">
              {countdown > 0 ? (
                <p className="text-sm text-cyber-gray-400">
                  Resend code in <span className="text-cyber-primary font-mono">{formatCountdown(countdown)}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpLoading}
                  className="text-sm text-cyber-secondary hover:text-cyber-primary transition-colors"
                >
                  Resend OTP
                </button>
              )}
              
              <button
                type="button"
                onClick={handleBackToPhone}
                className="block text-sm text-cyber-gray-400 hover:text-cyber-light transition-colors mx-auto"
              >
                Change phone number
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-cyber-gray-400">
            By continuing, you agree to our cyberpunk terms
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-cyber-secondary animate-pulse delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage