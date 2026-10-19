#include "storage.h"
#include <glib/gstdio.h>
#include <unistd.h>
#include <errno.h>
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
  if(result==SQLITE_OK) {
    g_chmod(file,0600);
  }
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

static gboolean valid_name(const char *name) {
  return name && g_utf8_validate(name,-1,NULL) && g_utf8_strlen(name,-1)>=1 && g_utf8_strlen(name,-1)<=180;
}
gboolean ef_store_rename_client(EfStore *store, gint64 id, const char *name, GError **error) {
  if (!store || !store->db || id<=0 || !valid_name(name)) {
    g_set_error_literal(error,ef_error(),7,"Identificador ou nome inválido"); return FALSE;
  }
  sqlite3_stmt *stmt=NULL;
  if(sqlite3_prepare_v2(store->db,"UPDATE clients SET name=? WHERE id=?",-1,&stmt,NULL)!=SQLITE_OK) return sql_error(store,error);
  sqlite3_bind_text(stmt,1,name,-1,SQLITE_TRANSIENT);
  sqlite3_bind_int64(stmt,2,id);
  int rc=sqlite3_step(stmt);
  int changes=sqlite3_changes(store->db);
  sqlite3_finalize(stmt);
  if(rc!=SQLITE_DONE) return sql_error(store,error);
  if(changes!=1) { g_set_error_literal(error,ef_error(),8,"Cliente não encontrado"); return FALSE; }
  return TRUE;
}
gboolean ef_store_check_integrity(EfStore *store, GError **error) {
  if(!store || !store->db) { g_set_error_literal(error,ef_error(),9,"Banco indisponível"); return FALSE; }
  sqlite3_stmt *stmt=NULL;
  if(sqlite3_prepare_v2(store->db,"PRAGMA integrity_check",-1,&stmt,NULL)!=SQLITE_OK) return sql_error(store,error);
  int rc=sqlite3_step(stmt);
  gboolean ok=rc==SQLITE_ROW && g_strcmp0((const char*)sqlite3_column_text(stmt,0),"ok")==0;
  sqlite3_finalize(stmt);
  if(!ok) { g_set_error_literal(error,ef_error(),10,"Falha na verificação de integridade SQLite"); return FALSE; }
  return TRUE;
}
static gboolean copy_database(sqlite3 *source, sqlite3 *target, GError **error) {
  sqlite3_backup *backup=sqlite3_backup_init(target,"main",source,"main");
  if(!backup) { g_set_error(error,ef_error(),11,"Falha ao iniciar cópia SQLite: %s",sqlite3_errmsg(target)); return FALSE; }
  int rc=sqlite3_backup_step(backup,-1);
  int finished=sqlite3_backup_finish(backup);
  if(rc!=SQLITE_DONE || finished!=SQLITE_OK) {
    g_set_error(error,ef_error(),12,"Falha ao copiar banco SQLite: %d/%d",rc,finished); return FALSE;
  }
  return TRUE;
}
gboolean ef_store_backup(EfStore *store, const char *destination, GError **error) {
  if(!store || !store->db || !destination || !*destination) {
    g_set_error_literal(error,ef_error(),13,"Destino de backup inválido"); return FALSE;
  }
  if(!ef_store_check_integrity(store,error)) return FALSE;
  if(!g_path_is_absolute(destination)) {
    g_set_error_literal(error,ef_error(),22,"Backup exige caminho absoluto");
    return FALSE;
  }
  if(g_file_test(destination,G_FILE_TEST_EXISTS)) {
    g_set_error_literal(error,ef_error(),20,"Destino já existe: backup não sobrescrito");
    return FALSE;
  }
  char *uuid=g_uuid_string_random();
  char *temporary=g_strdup_printf("%s.tmp-%s",destination,uuid);
  g_free(uuid);
  sqlite3 *target=NULL;
  if(sqlite3_open_v2(temporary,&target,SQLITE_OPEN_READWRITE|SQLITE_OPEN_CREATE,NULL)!=SQLITE_OK) {
    g_set_error_literal(error,ef_error(),14,"Não foi possível criar backup temporário");
    if(target)sqlite3_close(target);
    g_unlink(temporary);g_free(temporary);return FALSE;
  }
  gboolean ok=copy_database(store->db,target,error);
  if(sqlite3_close(target)!=SQLITE_OK)ok=FALSE;
  if(ok) {
    sqlite3 *verify=NULL;
    if(sqlite3_open_v2(temporary,&verify,SQLITE_OPEN_READONLY,NULL)!=SQLITE_OK)ok=FALSE;
    else {
      EfStore snapshot={verify};
      ok=ef_store_check_integrity(&snapshot,error);
      sqlite3_close(verify);
    }
  }
  if(ok)g_chmod(temporary,0600);
  if(ok && link(temporary,destination)!=0) {
    g_set_error(error,ef_error(),15,"Não foi possível finalizar backup sem sobrescrever: %s",g_strerror(errno));ok=FALSE;
  }
  g_unlink(temporary);
  g_free(temporary);
  return ok;
}
gboolean ef_store_restore(EfStore *store, const char *source, GError **error) {
  if(!store || !store->db || !source || !*source) {
    g_set_error_literal(error,ef_error(),16,"Origem de restauração inválida");return FALSE;
  }
  sqlite3 *incoming=NULL;
  if(sqlite3_open_v2(source,&incoming,SQLITE_OPEN_READONLY,NULL)!=SQLITE_OK) {
    g_set_error_literal(error,ef_error(),17,"Backup não encontrado ou inválido");
    if(incoming)sqlite3_close(incoming);
    return FALSE;
  }
  EfStore snapshot={incoming};
  gboolean ok=ef_store_check_integrity(&snapshot,error);
  if(ok) {
    sqlite3_stmt *stmt=NULL;
    if(sqlite3_prepare_v2(incoming,"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='clients'",-1,&stmt,NULL)!=SQLITE_OK)ok=FALSE;
    else {
      ok=sqlite3_step(stmt)==SQLITE_ROW && sqlite3_column_int(stmt,0)==1;
      sqlite3_finalize(stmt);
    }
    if(!ok && error && !*error)g_set_error_literal(error,ef_error(),18,"Backup sem esquema de clientes");
  }
  if(ok) {
    sqlite3 *rollback=NULL;
    if(sqlite3_open(":memory:",&rollback)!=SQLITE_OK) {
      g_set_error_literal(error,ef_error(),21,"Falha ao reservar cópia de segurança para restauração");
      ok=FALSE;
    } else {
      ok=copy_database(store->db,rollback,error);
      if(ok && !copy_database(incoming,store->db,error)) {
        GError *rollback_error=NULL;
        if(!copy_database(rollback,store->db,&rollback_error))
          g_warning("Falha crítica ao reverter restauração: %s",rollback_error->message);
        g_clear_error(&rollback_error);
        ok=FALSE;
      }
      sqlite3_close(rollback);
    }
  }
  sqlite3_close(incoming);
  return ok;
}
GPtrArray *ef_store_search_clients(EfStore *store, const char *query, GError **error) {
  if(!store || !store->db || !query || !g_utf8_validate(query,-1,NULL)) {
    g_set_error_literal(error,ef_error(),19,"Busca inválida");return NULL;
  }
  sqlite3_stmt *stmt=NULL;
  if(sqlite3_prepare_v2(store->db,"SELECT name FROM clients WHERE instr(lower(name),lower(?))>0 ORDER BY name COLLATE NOCASE",-1,&stmt,NULL)!=SQLITE_OK) {
    sql_error(store,error);return NULL;
  }
  sqlite3_bind_text(stmt,1,query,-1,SQLITE_TRANSIENT);
  GPtrArray *list=g_ptr_array_new_with_free_func(g_free);
  int rc;
  while((rc=sqlite3_step(stmt))==SQLITE_ROW)g_ptr_array_add(list,g_strdup((const char*)sqlite3_column_text(stmt,0)));
  sqlite3_finalize(stmt);
  if(rc!=SQLITE_DONE) {g_ptr_array_unref(list);sql_error(store,error);return NULL;}
  return list;
}

GPtrArray *ef_store_list_client_rows(EfStore *store, GError **error) {
  if(!store || !store->db) {
    g_set_error_literal(error,ef_error(),23,"Banco indisponível");
    return NULL;
  }
  sqlite3_stmt *stmt=NULL;
  if(sqlite3_prepare_v2(store->db,"SELECT id,name FROM clients ORDER BY name COLLATE NOCASE",-1,&stmt,NULL)!=SQLITE_OK) {
    sql_error(store,error);return NULL;
  }
  GPtrArray *rows=g_ptr_array_new_with_free_func(g_free);
  int rc;
  while((rc=sqlite3_step(stmt))==SQLITE_ROW) {
    char *line=g_strdup_printf("%" G_GINT64_FORMAT " — %s",sqlite3_column_int64(stmt,0),(const char*)sqlite3_column_text(stmt,1));
    g_ptr_array_add(rows,line);
  }
  sqlite3_finalize(stmt);
  if(rc!=SQLITE_DONE) {g_ptr_array_unref(rows);sql_error(store,error);return NULL;}
  return rows;
}
