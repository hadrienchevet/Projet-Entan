import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve('.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\s#]+)/)
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\s#]+)/)

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim())

async function check() {
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  console.log('Total profiles:', profileCount)

  const { data: sample } = await supabase
    .from('projects')
    .select('id, project_members(user_id, profiles(id, email, display_name))')
    .limit(1)
  
  console.log('Sample data structure:', JSON.stringify(sample, null, 2))
}

check()
