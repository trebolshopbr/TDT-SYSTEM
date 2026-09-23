// CONFIGURACIÓN SUPABASE · TDT
// Pegá acá los dos datos de tu proyecto. Están en Supabase → tu proyecto → botón "Connect"
// (o Project Settings → API Keys).
//
// Usá SÓLO la clave PUBLICABLE (empieza con "sb_publishable_").
// NUNCA pegues acá la clave secreta ("sb_secret_") ni la vieja "service_role":
// esas dan acceso total y no pueden estar en una página.
window.TDT_SUPABASE = {
  url: 'https://zffjultbznluqzweiuxj.supabase.co',
  publishableKey: 'sb_publishable_tfrcWxZCCG_UdzLSr40Zkg_KGyxJv1_',
  // Para entrar con usuario en vez de email: "admin" se convierte en "admin@tdt.local".
  // En Supabase, el usuario se crea con ese email completo.
  dominioUsuario: 'tdt.local'
};
