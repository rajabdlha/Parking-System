import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://yrdpuhokpqueabjdfjng.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZHB1aG9rcHF1ZWFiamRmam5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTY1NDMsImV4cCI6MjA5MTQzMjU0M30.GaNsWexVhxDrASrQ4D_YSVA6JBMw_2PtHIkh-I2Dmfw'
)
