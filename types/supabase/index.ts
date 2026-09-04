export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          credits: number
          tier: 'free' | 'lite' | 'pro' | 'premium'
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          credits?: number
          tier?: 'free' | 'lite' | 'pro' | 'premium'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          credits?: number
          tier?: 'free' | 'lite' | 'pro' | 'premium'
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: string
          status: 'active' | 'canceled' | 'expired'
          credits_monthly: number
          current_start: string | null
          current_end: string | null
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          tier: string
          status: 'active' | 'canceled' | 'expired'
          credits_monthly: number
          current_start?: string | null
          current_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: string
          status?: 'active' | 'canceled' | 'expired'
          credits_monthly?: number
          current_start?: string | null
          current_end?: string | null
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'purchase' | 'generation' | 'refund' | 'bonus'
          reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'purchase' | 'generation' | 'refund' | 'bonus'
          reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'purchase' | 'generation' | 'refund' | 'bonus'
          reference?: string | null
          created_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          model_id: string
          prompt: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          credits_cost: number
          cost_usd: number | null
          result_url: string | null
          duration_ms: number | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          model_id: string
          prompt: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_cost: number
          cost_usd?: number | null
          result_url?: string | null
          duration_ms?: number | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          model_id?: string
          prompt?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_cost?: number
          cost_usd?: number | null
          result_url?: string | null
          duration_ms?: number | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      models: {
        Row: {
          id: string
          provider: string
          display_name: string
          description: string | null
          credits_per_second: number
          is_active: boolean
          sort_order: number
        }
        Insert: {
          id: string
          provider: string
          display_name: string
          description?: string | null
          credits_per_second: number
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          provider?: string
          display_name?: string
          description?: string | null
          credits_per_second?: number
          is_active?: boolean
          sort_order?: number
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          prompt: string
          model_id: string
          cover_url: string | null
          usage_count: number
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          prompt: string
          model_id: string
          cover_url?: string | null
          usage_count?: number
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          prompt?: string
          model_id?: string
          cover_url?: string | null
          usage_count?: number
          tags?: string[]
          created_at?: string
        }
      }
    }
  }
}
