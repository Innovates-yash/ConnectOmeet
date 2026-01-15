import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Gamepad2, Star, Zap, CheckCircle, ArrowRight } from 'lucide-react'

import { RootState, AppDispatch } from '../store/store'
import { 
  createProfile, 
  fetchAvailableAvatars, 
  fetchAvailableInterestTags,
  CreateProfileRequest 
} from '../store/slices/profileSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'

// Validation schema
const profileSchema = z.object({
  avatarId: z.string().min(1, 'Please select an avatar'),
  displayName: z
    .string()
    .min(3, 'Display name must be at least 3 characters')
    .max(20, 'Display name must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Display name can only contain letters, numbers, underscores, and hyphens'),
  bio: z
    .string()
    .max(200, 'Bio must be at most 200 characters')
    .optional(),
  gameExperience: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  interestTags: z
    .array(z.string())
    .min(3, 'Please select at least 3 interest tags')
    .max(10, 'Please select at most 10 interest tags')
})

const GAMING_EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'New to gaming' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Some gaming experience' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Experienced gamer' },
  { value: 'EXPERT', label: 'Expert', description: 'Gaming veteran' }
]

const ProfileSetupPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { 
    isLoading, 
    availableAvatars, 
    availableInterestTags, 
    avatarsLoading, 
    tagsLoading 
  } = useSelector((state: RootState) => state.profile)
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  const [selectedAvatar, setSelectedAvatar] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<CreateProfileRequest>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      avatarId: '',
      displayName: '',
      bio: '',
      gameExperience: 'INTERMEDIATE',
      interestTags: []
    }
  })

  // Fetch available data on component mount
  useEffect(() => {
    dispatch(fetchAvailableAvatars())
    dispatch(fetchAvailableInterestTags())
  }, [dispatch])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth')
    }
  }, [isAuthenticated, navigate])

  // Update form values when selections change
  useEffect(() => {
    setValue('avatarId', selectedAvatar)
    setValue('interestTags', selectedTags)
  }, [selectedAvatar, selectedTags, setValue])

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else if (prev.length < 10) {
        return [...prev, tag]
      } else {
        toast.error('You can select at most 10 interest tags')
        return prev
      }
    })
  }

  const handleNextStep = async () => {
    let isValid = false
    
    switch (currentStep) {
      case 1:
        isValid = await trigger('avatarId')
        break
      case 2:
        isValid = await trigger('displayName')
        break
      case 3:
        isValid = await trigger('interestTags')
        break
      case 4:
        isValid = await trigger(['gameExperience', 'bio'])
        break
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: CreateProfileRequest) => {
    try {
      await dispatch(createProfile({
        avatarId: data.avatarId,
        displayName: data.displayName,
        bio: data.bio || '',
        interestTags: data.interestTags,
        gameExperience: data.gameExperience
      })).unwrap()

      toast.success('Profile created successfully! 🎉 You earned 1000 GameCoins!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile')
    }
  }

  const getAvatarDisplayName = (avatarId: string) => {
    return avatarId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-cyber-gray-400">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm text-cyber-gray-400">{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-cyber-darker rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-cyber-primary to-cyber-secondary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto text-cyber-primary mb-4" />
              <h2 className="text-2xl font-cyber text-cyber-primary mb-2">
                Choose Your Avatar
              </h2>
              <p className="text-cyber-gray-300">
                Select your cyberpunk identity
              </p>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {avatarsLoading ? (
                <div className="col-span-full flex justify-center">
                  <LoadingSpinner size="medium" />
                </div>
              ) : (
                availableAvatars.map((avatarId) => (
                  <div
                    key={avatarId}
                    onClick={() => handleAvatarSelect(avatarId)}
                    className={`
                      aspect-square bg-cyber-darker border-2 rounded-lg cursor-pointer transition-all duration-300
                      hover:border-cyber-primary hover:shadow-lg hover:shadow-cyber-primary/20
                      ${selectedAvatar === avatarId 
                        ? 'border-cyber-primary shadow-lg shadow-cyber-primary/30' 
                        : 'border-cyber-gray-700'
                      }
                    `}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <div className="text-2xl mb-1">🤖</div>
                      <div className="text-xs text-center text-cyber-gray-400 leading-tight">
                        {getAvatarDisplayName(avatarId)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {errors.avatarId && (
              <p className="text-red-400 text-sm text-center">{errors.avatarId.message}</p>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Star className="w-16 h-16 mx-auto text-cyber-primary mb-4" />
              <h2 className="text-2xl font-cyber text-cyber-primary mb-2">
                What's Your Handle?
              </h2>
              <p className="text-cyber-gray-300">
                Choose a unique display name
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-cyber-light mb-2">
                  Display Name
                </label>
                <input
                  {...register('displayName')}
                  id="displayName"
                  type="text"
                  placeholder="Enter your gaming handle"
                  className="input-cyber text-center text-xl"
                  maxLength={20}
                />
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-400">{errors.displayName.message}</p>
                )}
              </div>

              <div className="text-center text-sm text-cyber-gray-400">
                <p>• 3-20 characters</p>
                <p>• Letters, numbers, underscores, and hyphens only</p>
                <p>• Must be unique</p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Gamepad2 className="w-16 h-16 mx-auto text-cyber-primary mb-4" />
              <h2 className="text-2xl font-cyber text-cyber-primary mb-2">
                What's Your Vibe?
              </h2>
              <p className="text-cyber-gray-300">
                Select at least 3 interests (max 10)
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <span className="text-sm text-cyber-gray-400">
                  Selected: {selectedTags.length}/10 (minimum 3)
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {tagsLoading ? (
                  <div className="col-span-full flex justify-center">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : (
                  availableInterestTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${selectedTags.includes(tag)
                          ? 'bg-cyber-primary text-cyber-dark border-2 border-cyber-primary'
                          : 'bg-cyber-darker text-cyber-gray-300 border-2 border-cyber-gray-700 hover:border-cyber-primary'
                        }
                      `}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <CheckCircle className="inline w-4 h-4 ml-1" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {errors.interestTags && (
                <p className="text-red-400 text-sm text-center">{errors.interestTags.message}</p>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="w-16 h-16 mx-auto text-cyber-primary mb-4" />
              <h2 className="text-2xl font-cyber text-cyber-primary mb-2">
                Final Touches
              </h2>
              <p className="text-cyber-gray-300">
                Tell us about your gaming experience
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-cyber-light mb-3">
                  Gaming Experience
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {GAMING_EXPERIENCE_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={`
                        cursor-pointer p-4 rounded-lg border-2 transition-all duration-200
                        ${watch('gameExperience') === level.value
                          ? 'border-cyber-primary bg-cyber-primary/10'
                          : 'border-cyber-gray-700 hover:border-cyber-primary/50'
                        }
                      `}
                    >
                      <input
                        {...register('gameExperience')}
                        type="radio"
                        value={level.value}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium text-cyber-light">{level.label}</div>
                        <div className="text-sm text-cyber-gray-400 mt-1">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-cyber-light mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  {...register('bio')}
                  id="bio"
                  placeholder="Tell other gamers about yourself..."
                  className="input-cyber resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-right text-xs text-cyber-gray-400 mt-1">
                  {watch('bio')?.length || 0}/200
                </div>
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-cyber text-gradient mb-4">
            Vibe Check
          </h1>
          <p className="text-cyber-gray-300 text-lg">
            Let's set up your cyberpunk gaming profile
          </p>
        </div>

        <div className="card-cyber-glow max-w-2xl mx-auto">
          {renderProgressBar()}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-cyber-gray-700">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200
                  ${currentStep === 1
                    ? 'text-cyber-gray-500 cursor-not-allowed'
                    : 'text-cyber-gray-300 hover:text-cyber-light border border-cyber-gray-600 hover:border-cyber-gray-500'
                  }
                `}
              >
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-cyber flex items-center"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-cyber flex items-center"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-cyber-gray-400">
            Complete your profile to earn 1000 GameCoins and unlock the full GameVerse experience
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetupPage