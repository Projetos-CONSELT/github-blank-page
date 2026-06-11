import { createClient } from '@supabase/supabase-js'

// O Vite usa import.meta.env para ler as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria e exporta o cliente para ser usado em outras telas
export const supabase = createClient(supabaseUrl, supabaseAnonKey)