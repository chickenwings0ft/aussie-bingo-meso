// Proyecto de Supabase para sincronizar el cartón entre móviles.
// La clave «publishable» es pública por diseño: solo permite llamar a la
// función sync_card(); la tabla no es accesible directamente (ver supabase/schema.sql).
// Deja `url` vacío para desactivar la sincronización.
export const SUPABASE = {
  url: 'https://lhjzvcqsruvnrkzdytbr.supabase.co',
  key: 'sb_publishable_Ze8cjdWjmoXmyHL57csrVw_-uuXtcFE',
};
