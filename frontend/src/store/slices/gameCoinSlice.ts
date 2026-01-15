import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { gameCoinApi } from '../../services/api'

export interface GameCoinTransaction {
  id: string
  amount: number
  type: 'EARNED' | 'SPENT'
  description: string
  timestamp: string
}

export interface GameCoinState {
  balance: number
  transactions: GameCoinTransaction[]
  isLoading: boolean
  error: string | null
  dailyBonusAvailable: boolean
  lastBonusClaimedAt: string | null
}

const initialState: GameCoinState = {
  balance: 0,
  transactions: [],
  isLoading: false,
  error: null,
  dailyBonusAvailable: true,
  lastBonusClaimedAt: null,
}

// Async thunks
export const fetchBalance = createAsyncThunk(
  'gameCoin/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gameCoinApi.getBalance()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch balance')
    }
  }
)

export const fetchTransactions = createAsyncThunk(
  'gameCoin/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gameCoinApi.getTransactions()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions')
    }
  }
)

export const claimDailyBonus = createAsyncThunk(
  'gameCoin/claimDailyBonus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gameCoinApi.claimDailyBonus()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to claim daily bonus')
    }
  }
)

export const spendCoins = createAsyncThunk(
  'gameCoin/spend',
  async ({ amount, description }: { amount: number; description: string }, { rejectWithValue }) => {
    try {
      const response = await gameCoinApi.spendCoins(amount, description)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to spend coins')
    }
  }
)

const gameCoinSlice = createSlice({
  name: 'gameCoin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload
    },
    addTransaction: (state, action: PayloadAction<GameCoinTransaction>) => {
      state.transactions.unshift(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Balance
      .addCase(fetchBalance.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isLoading = false
        state.balance = action.payload.balance
        state.dailyBonusAvailable = action.payload.dailyBonusAvailable
        state.lastBonusClaimedAt = action.payload.lastBonusClaimedAt
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false
        state.transactions = action.payload
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Claim Daily Bonus
      .addCase(claimDailyBonus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(claimDailyBonus.fulfilled, (state, action) => {
        state.isLoading = false
        state.balance = action.payload.newBalance
        state.dailyBonusAvailable = false
        state.lastBonusClaimedAt = new Date().toISOString()
        state.transactions.unshift({
          id: Date.now().toString(),
          amount: action.payload.bonusAmount,
          type: 'EARNED',
          description: 'Daily Bonus',
          timestamp: new Date().toISOString(),
        })
      })
      .addCase(claimDailyBonus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Spend Coins
      .addCase(spendCoins.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(spendCoins.fulfilled, (state, action) => {
        state.isLoading = false
        state.balance = action.payload.newBalance
        state.transactions.unshift(action.payload.transaction)
      })
      .addCase(spendCoins.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, updateBalance, addTransaction } = gameCoinSlice.actions
export default gameCoinSlice.reducer