export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number;
          name: string;
          price: number;
          image: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          price: number;
          image: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          price?: number;
          image?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: number;
          product_id: number;
          quantity: number;
          total_amount: number;
          payment_status: string;
          payment_id: string | null;
          customer_email: string | null;
          payment_method: string | null;
          payment_amount: number | null;
          payment_currency: string | null;
          payment_completed_at: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          shipping_address: string | null;
          order_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          quantity: number;
          total_amount: number;
          payment_status?: string;
          payment_id?: string | null;
          customer_email?: string | null;
          payment_method?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_completed_at?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          shipping_address?: string | null;
          order_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          quantity?: number;
          total_amount?: number;
          payment_status?: string;
          payment_id?: string | null;
          customer_email?: string | null;
          payment_method?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_completed_at?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          shipping_address?: string | null;
          order_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: number;
          order_id: number;
          payment_method: string;
          payment_provider_id: string | null;
          amount: number;
          currency: string;
          status: string;
          provider_response: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          order_id: number;
          payment_method: string;
          payment_provider_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          provider_response?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_id?: number;
          payment_method?: string;
          payment_provider_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          provider_response?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}