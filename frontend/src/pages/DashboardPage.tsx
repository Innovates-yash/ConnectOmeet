import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import LogoutButton from '../components/auth/LogoutButton'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useSelector((state: RootState) => state.profile)
  const { balance } = useSelector((state: RootState) => state.gameCoin)

  const handleCardClick = (cardTitle: string) => {
    switch (cardTitle) {
      case 'Meet People':
        navigate('/discover')
        break
      case 'The Room (Lounge)':
        navigate('/room')
        break
      case 'Game with Friend':
        navigate('/private-lobby')
        break
      case 'Play with Stranger':
        navigate('/matchmaking')
        break
      default:
        console.log(`Navigation for ${cardTitle} not implemented yet`)
    }
  }

  const dashboardCards = [
    {
      title: 'Meet People',
      description: 'Discover compatible gaming partners through our Smart Connect algorithm',
      icon: '🔮',
      color: 'border-cyber-primary',
      bgGradient: 'from-cyber-primary/20 to-cyber-primary/5',
      hoverGlow: 'hover:shadow-cyber-primary',
    },
    {
      title: 'The Room (Lounge)',
      description: 'Join virtual lobbies with real-time chat and see who\'s online',
      icon: '🌐',
      color: 'border-cyber-secondary',
      bgGradient: 'from-cyber-secondary/20 to-cyber-secondary/5',
      hoverGlow: 'hover:shadow-cyber-secondary',
    },
    {
      title: 'Game with Friend',
      description: 'Create private lobbies with invite codes for your gaming crew',
      icon: '⚡',
      color: 'border-green-400',
      bgGradient: 'from-green-400/20 to-green-400/5',
      hoverGlow: 'hover:shadow-green-400',
    },
    {
      title: 'Play with Stranger',
      description: 'Enter the matchmaking queue and face random opponents',
      icon: '🎯',
      color: 'border-yellow-400',
      bgGradient: 'from-yellow-400/20 to-yellow-400/5',
      hoverGlow: 'hover:shadow-yellow-400',
    },
  ]

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="border-b border-cyber-gray-700 bg-cyber-darker">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-cyber text-gradient">
              GameVerse
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-cyber-primary font-mono">
                💰 {balance || 1000} GameCoins
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyber-primary rounded-full flex items-center justify-center">
                  <span className="text-cyber-dark font-bold">
                    {profile?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-cyber-light font-medium">
                    {profile?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-cyber-gray-400">
                    {profile?.gameExperience || 'Beginner'}
                  </p>
                </div>
                <LogoutButton variant="icon" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-cyber text-gradient mb-6 animate-pulse">
            Welcome to the Cyberpunk Gaming Universe
          </h2>
          <p className="text-cyber-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
            Choose your gaming adventure, <span className="text-cyber-primary font-semibold">{profile?.displayName || 'Gamer'}</span>
          </p>
          <div className="mt-4 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(card.title)}
              className={`
                relative overflow-hidden rounded-xl border-2 ${card.color} 
                bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm
                cursor-pointer transition-all duration-500 ease-out
                hover:scale-105 hover:border-opacity-100 ${card.hoverGlow}
                transform-gpu group min-h-[200px] p-6
                before:absolute before:inset-0 before:bg-gradient-to-r 
                before:from-transparent before:via-white/5 before:to-transparent
                before:translate-x-[-100%] hover:before:translate-x-[100%]
                before:transition-transform before:duration-700
              `}
            >
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse"></div>
              </div>
              
              {/* Card content */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="text-center">
                  <div className="text-5xl mb-4 group-hover:animate-bounce transition-all duration-300 filter drop-shadow-lg">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-cyber text-cyber-light mb-3 group-hover:text-white transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-cyber-gray-300 text-sm leading-relaxed group-hover:text-cyber-gray-200 transition-colors">
                    {card.description}
                  </p>
                </div>
                
                {/* Hover indicator */}
                <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs text-cyber-primary font-mono uppercase tracking-wider">
                    Click to Enter →
                  </span>
                </div>
              </div>
              
              {/* Corner accent */}
              <div className={`absolute top-0 right-0 w-16 h-16 ${card.color.replace('border-', 'bg-')} opacity-20 transform rotate-45 translate-x-8 -translate-y-8`}></div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card-cyber text-center group hover:border-cyber-primary transition-all duration-300">
            <div className="text-cyber-primary text-3xl mb-2 group-hover:animate-pulse">🎮</div>
            <h3 className="text-lg font-cyber text-cyber-primary mb-2">
              Games Played
            </h3>
            <p className="text-4xl font-mono text-cyber-light group-hover:text-cyber-primary transition-colors">
              {profile?.totalGamesPlayed || 0}
            </p>
          </div>
          <div className="card-cyber text-center group hover:border-cyber-secondary transition-all duration-300">
            <div className="text-cyber-secondary text-3xl mb-2 group-hover:animate-pulse">👥</div>
            <h3 className="text-lg font-cyber text-cyber-secondary mb-2">
              Friends Made
            </h3>
            <p className="text-4xl font-mono text-cyber-light group-hover:text-cyber-secondary transition-colors">0</p>
          </div>
          <div className="card-cyber text-center group hover:border-green-400 transition-all duration-300">
            <div className="text-green-400 text-3xl mb-2 group-hover:animate-pulse">🏆</div>
            <h3 className="text-lg font-cyber text-green-400 mb-2">
              Win Rate
            </h3>
            <p className="text-4xl font-mono text-cyber-light group-hover:text-green-400 transition-colors">
              {profile?.totalGamesPlayed ? Math.round((profile.totalGamesWon / profile.totalGamesPlayed) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="mt-16 card-cyber-glow max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyber-primary to-cyber-secondary rounded-full flex items-center justify-center mr-4">
                <span className="text-cyber-dark font-bold text-xl">
                  {profile.displayName?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-cyber text-cyber-primary">
                  Your Gaming Profile
                </h3>
                <p className="text-cyber-gray-400">Level up your cyberpunk journey</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-medium text-cyber-light mb-3 uppercase tracking-wider">
                  🎯 Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interestTags?.map((interest: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-cyber-primary bg-opacity-20 border border-cyber-primary text-cyber-primary text-sm rounded-full hover:bg-opacity-30 transition-all duration-200"
                    >
                      {interest}
                    </span>
                  )) || (
                    <span className="text-cyber-gray-400 text-sm italic">No interests selected</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-cyber-light mb-3 uppercase tracking-wider">
                  ⚡ Experience Level
                </h4>
                <div className="flex items-center space-x-3">
                  <span className="px-6 py-3 bg-cyber-secondary bg-opacity-20 border border-cyber-secondary text-cyber-secondary text-sm rounded-lg font-medium">
                    {profile.gameExperience}
                  </span>
                  <div className="flex-1 bg-cyber-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyber-secondary to-cyber-primary h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: profile.gameExperience === 'BEGINNER' ? '25%' : 
                               profile.gameExperience === 'INTERMEDIATE' ? '50%' : 
                               profile.gameExperience === 'ADVANCED' ? '75%' : '100%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {profile.bio && (
              <div className="mt-6 pt-6 border-t border-cyber-gray-700">
                <h4 className="text-sm font-medium text-cyber-light mb-2 uppercase tracking-wider">
                  📝 Bio
                </h4>
                <p className="text-cyber-gray-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage