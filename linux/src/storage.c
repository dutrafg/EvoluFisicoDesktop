#include "storage.h"
#include <glib/gstdio.h>
static GQuark ef_error(void) { return g_quark_from_static_string("evolufisico-storage"); }
static gboolean sql_error(EfStore *store, GError **error) {
  g_set_error(error, ef_error(), 1, "%s", sqlite3_errmsg(store->db)); return FALSE;
}
gboolean ef_store_open(EfStore *store, GError **error) {
  g_return_val_if_fail(store && !store->db, FALSE);
  char *dir = g_build_filename(g_get_user_data_dir(), "evolufisico", NULL);
  if (g_mkdir_with_parents(dir, 0700) != 0) {
    g_set_error_literal(error, ef_error(), 2, "Não foi possível criar diretório de dados");
    g_free(dir); return FALSE;
  }
  char *file = g_build_filename(dir, "records.sqlite", NULL);
  g_free(dir);
  int result = sqlite3_open_v2(file, &store->db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX, NULL);
  g_free(file);
  if (result != SQLITE_OK) { sql_error(store, error); ef_store_close(store); return FALSE; }
  sqlite3_busy_timeout(store->db, 5000);
  const char *schema = "PRAGMA foreign_keys=ON;"
    "PRAGMA user_version=1;"
    "CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 180), created_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);";
  if (sqlite3_exec(store->db, schema, NULL, NULL, NULL) != SQLITE_OK) { sql_error(store, error); ef_store_close(store); return FALSE; }
  return TRUE;
}
void ef_store_close(EfStore *store) {
  if (store && store->db) { sqlite3_close(store->db); store->db = NULL; }
}
gboolean ef_store_add_client(EfStore *store, const char *name, GError **error) {
  if (!store || !store->db || !name || !g_utf8_validate(name,-1,NULL) || g_utf8_strlen(name,-1)<1 || g_utf8_strlen(name,-1)>180) {
    g_set_error_literal(error, ef_error(), 3, "Nome inválido (1 a 180 caracteres)"); return FALSE;
  }
  sqlite3_stmt *stmt=NULL;
  if (sqlite3_prepare_v2(store->db,"INSERT INTO clients(name) VALUES(?)",-1,&stmt,NULL)!=SQLITE_OK) return sql_error(store,error);
  sqlite3_bind_text(stmt,1,name,-1,SQLITE_TRANSIENT);
  int result=sqlite3_step(stmt);
  sqlite3_finalize(stmt);
  return result==SQLITE_DONE ? TRUE : sql_error(store,error);
}
GPtrArray *ef_store_list_clients(EfStore *store, GError **error) {
  if (!store || !store->db) { g_set_error_literal(error,ef_error(),4,"Banco indisponível"); return NULL; }
  sqlite3_stmt *stmt=NULL;
  if (sqlite3_prepare_v2(store->db,"SELECT name FROM clients ORDER BY name COLLATE NOCASE",-1,&stmt,NULL)!=SQLITE_OK) { sql_error(store,error); return NULL; }
  GPtrArray *list=g_ptr_array_new_with_free_func(g_free);
  int rc;
  while ((rc=sqlite3_step(stmt))==SQLITE_ROW) g_ptr_array_add(list,g_strdup((const char*)sqlite3_column_text(stmt,0)));
  sqlite3_finalize(stmt);
  if (rc!=SQLITE_DONE) { g_ptr_array_unref(list); sql_error(store,error); return NULL; }
  return list;
}
gboolean ef_store_delete_client(EfStore *store, gint64 id, GError **error) {
  if (!store || !store->db || id<=0) { g_set_error_literal(error,ef_error(),5,"Identificador inválido"); return FALSE; }
  sqlite3_stmt *stmt=NULL;
  if (sqlite3_prepare_v2(store->db,"DELETE FROM clients WHERE id=?",-1,&stmt,NULL)!=SQLITE_OK) return sql_error(store,error);
  sqlite3_bind_int64(stmt,1,id);
  int rc=sqlite3_step(stmt);
  int changed=sqlite3_changes(store->db);
  sqlite3_finalize(stmt);
  if(rc!=SQLITE_DONE) return sql_error(store,error);
  if(changed!=1) { g_set_error_literal(error,ef_error(),6,"Cliente não encontrado"); return FALSE; }
  return TRUE;
}
