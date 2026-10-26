
iimport { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tuaegbfkvreotumttsxf.supabase.co'
const supabasePublishableKey = 'sb_publishable_2zW_7IzV1uygU7iN3O9Frg_CCv7V_zh'

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)
