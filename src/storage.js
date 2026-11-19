const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile(file, objectPath) {
  const { error } = await supabase.storage
    .from('attachments')
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

module.exports = {
  uploadFile
};