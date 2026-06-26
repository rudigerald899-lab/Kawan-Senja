import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xggunlrfkssvbqopwnps.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZ3VubHJma3NzdmJxb3B3bnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTM5NDcsImV4cCI6MjA5ODAyOTk0N30.NHOxcvYF_LrsTevzTSK9U7X33kUYnH9HO1LU5pYUYkg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
