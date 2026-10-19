#pragma once
#include <glib.h>
#include <sqlite3.h>
typedef struct { sqlite3 *db; } EfStore;
gboolean ef_store_open(EfStore *store, GError **error);
void ef_store_close(EfStore *store);
gboolean ef_store_add_client(EfStore *store, const char *name, GError **error);
GPtrArray *ef_store_list_clients(EfStore *store, GError **error);
gboolean ef_store_delete_client(EfStore *store, gint64 id, GError **error);
