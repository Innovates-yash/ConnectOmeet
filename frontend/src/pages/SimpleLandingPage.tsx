import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Gamepad2, 
  Users, 
  Trophy, 
  Coins, 
  Zap, 
  Shield,
  ArrowRight,
  Play
} from 'lucide-react'

const SimpleLandingPage: React.FC = () => {
  const games = [
    { name: 'Car Racing', icon: '🏎️', players: '2-4' },
    { name: 'Chess', icon: '♟️', players: '2' },
    { name: 'UNO', icon: '🃏', players: '2-4' },
    { name: 'Rummy', icon: '🎴', players: '2-6' },
    { name: 'Ludo', icon: '🎲', players: '2-4' },
    { name: 'Truth or Dare', icon: '💭', players: '3-8' },
    { name: 'Meme Battle', icon: '😂', players: '2-10' },
    { name: 'Bubble Blast', icon: '🫧', players: '1-4' },
    { name: 'Fighting', icon: '👊', players: '2' },
    { name: 'Math Master', icon: '🧮', players: '2-6' },
  ]

  const features = [
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: '10 Amazing Games',
      description: 'From classic board games to modern arcade action'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Social Gaming',
      description: 'Connect with friends and make new ones'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Competitive Play',
      description: 'Climb leaderboards and earn achievements'
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: 'Virtual Currency',
      description: 'Earn GameCoins and unlock rewards'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Real-time Action',
      description: 'Lightning-fast multiplayer gaming'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Platform',
      description: 'Safe and fair gaming environment'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-dark via-gray-900 to-cyber-dark text-cyber-light">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gamepad2 className="w-8 h-8 text-cyber-primary" />
            <span className="text-2xl font-bold font-cyber text-cyber-primary">GameVerse</span>
          </div>
          
          <div>
            <Link
              to="/auth"
              className="bg-cyber-primary text-cyber-dark px-6 py-2 rounded-lg font-semibold hover:bg-cyber-secondary transition-colors duration-200 flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Playing</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold font-cyber mb-6 bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent bg-clip-text text-transparent">
            GAMEVERSE
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Connect, compete, and conquer in the ultimate social gaming experience. 
            10 games, infinite possibilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/auth"
              className="bg-cyber-primary text-cyber-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-cyber-secondary transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-cyber-primary/25"
            >
              <Play className="w-5 h-5" />
              <span>Join the Game</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <button className="border-2 border-cyber-primary text-cyber-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-cyber-primary hover:text-cyber-dark transition-all duration-200">
              Watch Demo
            </button>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyber-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="px-6 py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold font-cyber text-center mb-16 text-cyber-primary">
            Choose Your Game
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {games.map((game) => (
              <div
                key={game.name}
                className="bg-gray-800/50 backdrop-blur-sm border border-cyber-primary/20 rounded-xl p-6 text-center hover:border-cyber-primary/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {game.icon}
                </div>
                <h3 className="font-semibold text-cyber-light mb-2">{game.name}</h3>
                <p className="text-sm text-gray-400">{game.players} players</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold font-cyber text-center mb-16 text-cyber-primary">
            Why GameVerse?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-gray-800/30 backdrop-blur-sm border border-cyber-primary/20 rounded-xl p-8 hover:border-cyber-primary/50 hover:bg-gray-800/50 transition-all duration-300"
              >
                <div className="text-cyber-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-cyber-light">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-cyber-primary/10 to-cyber-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-cyber mb-6 text-cyber-primary">
            Ready to Play?
          </h2>
          
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of players in the most exciting social gaming platform. 
            Sign up now and get 1000 free GameCoins!
          </p>
          
          <div>
            <Link
              to="/auth"
              className="bg-cyber-primary text-cyber-dark px-12 py-4 rounded-lg font-bold text-xl hover:bg-cyber-secondary transition-all duration-200 inline-flex items-center space-x-3 shadow-lg hover:shadow-cyber-primary/25"
            >
              <Play className="w-6 h-6" />
              <span>Start Your Journey</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900/80 border-t border-cyber-primary/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Gamepad2 className="w-6 h-6 text-cyber-primary" />
            <span className="text-xl font-bold font-cyber text-cyber-primary">GameVerse</span>
          </div>
          <p className="text-gray-400">
            © 2024 GameVerse. All rights reserved. Built with ❤️ for gamers.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default SimpleLandingPage