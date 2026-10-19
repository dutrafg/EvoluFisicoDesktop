#include <gtk/gtk.h>
#include "storage.h"
#include <errno.h>
#include <math.h>

typedef struct {
  EfStore store;
  GtkWidget *client_list;
  GtkWidget *client_entry;
  GtkWidget *status;
  GtkWidget *search_entry;
  GtkWidget *backup_entry;
  GtkWidget *settings_status;
  GtkWidget *restore_entry;
  GtkWidget *client_edit_entry;
  GtkWidget *client_id_entry;
  GtkWidget *assessment_client;
  GtkWidget *assessment_date;
  GtkWidget *assessment_weight;
  GtkWidget *assessment_height;
  GtkWidget *assessment_status;
  GtkWidget *assessment_list;
  GtkWidget *charge_client;
  GtkWidget *charge_cents;
  GtkWidget *charge_description;
  GtkWidget *charge_status;
  GtkWidget *charge_list;
} AppState;

static gboolean read_id(GtkWidget *entry,gint64 *out) {
  const char *value=gtk_editable_get_text(GTK_EDITABLE(entry));
  if(!*value)return FALSE;
  errno=0;char *end=NULL;
  gint64 parsed=g_ascii_strtoll(value,&end,10);
  if(errno==ERANGE || !end || *end || parsed<=0)return FALSE;
  *out=parsed;return TRUE;
}
static gboolean read_positive_double(GtkWidget *entry,double *out) {
  const char *value=gtk_editable_get_text(GTK_EDITABLE(entry));
  if(!*value)return FALSE;
  errno=0;char *end=NULL;
  double parsed=g_ascii_strtod(value,&end);
  if(errno==ERANGE || !end || *end || !isfinite(parsed) || parsed<=0)return FALSE;
  *out=parsed;return TRUE;
}
static void refresh_clients(AppState *state) {
  GtkWidget *child;
  while ((child=gtk_widget_get_first_child(state->client_list)))
    gtk_list_box_remove(GTK_LIST_BOX(state->client_list),child);
  GError *error=NULL;
  const char *query=state->search_entry ? gtk_editable_get_text(GTK_EDITABLE(state->search_entry)) : "";
  GPtrArray *clients=*query ? ef_store_search_clients(&state->store,query,&error) : ef_store_list_client_rows(&state->store,&error);
  if(!clients) {
    gtk_label_set_text(GTK_LABEL(state->status),error->message);
    g_clear_error(&error);return;
  }
  for(guint i=0;i<clients->len;i++){
    GtkWidget *label=gtk_label_new(g_ptr_array_index(clients,i));
    gtk_widget_set_halign(label,GTK_ALIGN_START);
    gtk_widget_set_margin_top(label,8);
    gtk_widget_set_margin_bottom(label,8);
    gtk_list_box_append(GTK_LIST_BOX(state->client_list),label);
  }
  g_ptr_array_unref(clients);
}
static void rename_client_clicked(GtkButton *button,gpointer data) {
  (void)button;
  AppState *state=data;
  gint64 id=0;
  if(!read_id(state->client_id_entry,&id)) {
    gtk_label_set_text(GTK_LABEL(state->status),"Informe um ID numérico válido.");
    return;
  }
  char *name=g_strdup(gtk_editable_get_text(GTK_EDITABLE(state->client_edit_entry)));
  g_strstrip(name);
  GError *error=NULL;
  if(ef_store_rename_client(&state->store,id,name,&error)) {
    gtk_label_set_text(GTK_LABEL(state->status),"Cliente atualizado.");
    refresh_clients(state);
  }else{
    gtk_label_set_text(GTK_LABEL(state->status),error ? error->message : "Falha na edição.");
    g_clear_error(&error);
  }
  g_free(name);
}
static void on_search(GtkEditable *entry, gpointer data) {
  (void)entry;
  refresh_clients(data);
}
static void add_client(GtkButton *button, gpointer data) {
  (void)button;
  AppState *state=data;
  const char *name=gtk_editable_get_text(GTK_EDITABLE(state->client_entry));
  char *clean=g_strdup(name);
  g_strstrip(clean);
  GError *error=NULL;
  if(!ef_store_add_client(&state->store,clean,&error)) {
    gtk_label_set_text(GTK_LABEL(state->status),error->message);
    g_clear_error(&error);
  } else {
    gtk_editable_set_text(GTK_EDITABLE(state->client_entry),"");
    gtk_label_set_text(GTK_LABEL(state->status),"Cliente salvo no SQLite local.");
    refresh_clients(state);
  }
  g_free(clean);
}
static void backup_clicked(GtkButton *button,gpointer data) {
  (void)button;
  AppState *state=data;
  const char *path=gtk_editable_get_text(GTK_EDITABLE(state->backup_entry));
  GError *error=NULL;
  if(ef_store_backup(&state->store,path,&error)) {
    gtk_label_set_text(GTK_LABEL(state->settings_status),"Backup SQLite criado e validado.");
  }else{
    gtk_label_set_text(GTK_LABEL(state->settings_status),error ? error->message : "Erro ao salvar backup.");
    g_clear_error(&error);
  }
}
static void restore_confirmed(GtkDialog *dialog, gint response, gpointer data) {
  AppState *state=data;
  gtk_window_destroy(GTK_WINDOW(dialog));
  if(response!=GTK_RESPONSE_ACCEPT) return;
  const char *path=gtk_editable_get_text(GTK_EDITABLE(state->restore_entry));
  GError *error=NULL;
  if(ef_store_restore(&state->store,path,&error)) {
    gtk_label_set_text(GTK_LABEL(state->settings_status),"Restauração concluída. Confira os dados.");
    refresh_clients(state);
  } else {
    gtk_label_set_text(GTK_LABEL(state->settings_status),error ? error->message : "Restauração falhou.");
    g_clear_error(&error);
  }
}
static void restore_clicked(GtkButton *button,gpointer data) {
  AppState *state=data;
  GtkWidget *window=gtk_widget_get_ancestor(GTK_WIDGET(button),GTK_TYPE_WINDOW);
  GtkWidget *dialog=gtk_message_dialog_new(GTK_WINDOW(window),GTK_DIALOG_MODAL,
    GTK_MESSAGE_WARNING,GTK_BUTTONS_NONE,
    "A restauração substituirá os clientes existentes. Continuar?");
  gtk_dialog_add_button(GTK_DIALOG(dialog),"Cancelar",GTK_RESPONSE_CANCEL);
  gtk_dialog_add_button(GTK_DIALOG(dialog),"Restaurar",GTK_RESPONSE_ACCEPT);
  g_signal_connect(dialog,"response",G_CALLBACK(restore_confirmed),state);
  gtk_window_present(GTK_WINDOW(dialog));
}
static void integrity_clicked(GtkButton *button,gpointer data) {
  (void)button;
  AppState *state=data;
  GError *error=NULL;
  if(ef_store_check_integrity(&state->store,&error))
    gtk_label_set_text(GTK_LABEL(state->settings_status),"SQLite íntegro.");
  else {
    gtk_label_set_text(GTK_LABEL(state->settings_status),error ? error->message : "Falha de integridade.");
    g_clear_error(&error);
  }
}
static void navigate(GtkButton *button, gpointer data) {
  GtkStack *stack=GTK_STACK(data);
  gtk_stack_set_visible_child(stack,GTK_WIDGET(g_object_get_data(G_OBJECT(button),"target-page")));
}
static void destroy_state(gpointer data) {
  AppState *state=data;
  ef_store_close(&state->store);
  g_free(state);
}
static void activate(GtkApplication *app,gpointer data) {
  (void)data;
  AppState *state=g_new0(AppState,1);
  GError *error=NULL;
  if(!ef_store_open(&state->store,&error)) {
    g_warning("SQLite indisponível: %s",error->message);
    g_clear_error(&error);
  }
  GtkWidget *window=gtk_application_window_new(app);
  g_object_set_data_full(G_OBJECT(window),"app-state",state,destroy_state);
  gtk_window_set_title(GTK_WINDOW(window),"EvoluFisico Linux — GTK4");
  gtk_window_set_default_size(GTK_WINDOW(window),1100,720);
  GtkWidget *root=gtk_box_new(GTK_ORIENTATION_HORIZONTAL,0);
  GtkWidget *sidebar=gtk_box_new(GTK_ORIENTATION_VERTICAL,12);
  gtk_widget_set_size_request(sidebar,230,-1);
  gtk_widget_set_margin_start(sidebar,20);
  gtk_widget_set_margin_end(sidebar,20);
  gtk_widget_set_margin_top(sidebar,30);
  GtkWidget *brand=gtk_label_new("EvoluFisico");
  gtk_widget_add_css_class(brand,"title-2");
  gtk_box_append(GTK_BOX(sidebar),brand);
  const char *items[]={"Início","Clientes","Avaliações","Cobranças","Relatórios","Configurações"};
  GtkWidget *stack=gtk_stack_new();
  gtk_stack_set_transition_type(GTK_STACK(stack),GTK_STACK_TRANSITION_TYPE_SLIDE_LEFT_RIGHT);
  for(guint i=0;i<G_N_ELEMENTS(items);i++){
    GtkWidget *button=gtk_button_new_with_label(items[i]);
    GtkWidget *page=gtk_box_new(GTK_ORIENTATION_VERTICAL,14);
    gtk_widget_set_margin_start(page,32);
    gtk_widget_set_margin_end(page,32);
    gtk_widget_set_margin_top(page,40);
    GtkWidget *heading=gtk_label_new(items[i]);
    gtk_widget_add_css_class(heading,"title-1");
    gtk_widget_set_halign(heading,GTK_ALIGN_START);
    gtk_box_append(GTK_BOX(page),heading);
    if(i==1){
      GtkWidget *form=gtk_box_new(GTK_ORIENTATION_HORIZONTAL,8);
      state->client_entry=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->client_entry),"Nome do cliente");
      gtk_widget_set_hexpand(state->client_entry,TRUE);
      GtkWidget *save=gtk_button_new_with_label("Salvar cliente");
      gtk_box_append(GTK_BOX(form),state->client_entry);
      gtk_box_append(GTK_BOX(form),save);
      gtk_box_append(GTK_BOX(page),form);
      state->status=gtk_label_new("Dados locais: prévia sem criptografia.");
      gtk_widget_set_halign(state->status,GTK_ALIGN_START);
      gtk_box_append(GTK_BOX(page),state->status);
      GtkWidget *edit_row=gtk_box_new(GTK_ORIENTATION_HORIZONTAL,8);
      state->client_id_entry=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->client_id_entry),"ID do cliente");
      gtk_widget_set_size_request(state->client_id_entry,125,-1);
      state->client_edit_entry=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->client_edit_entry),"Novo nome");
      GtkWidget *rename=gtk_button_new_with_label("Renomear");
      gtk_box_append(GTK_BOX(edit_row),state->client_id_entry);
      gtk_box_append(GTK_BOX(edit_row),state->client_edit_entry);
      gtk_box_append(GTK_BOX(edit_row),rename);
      gtk_box_append(GTK_BOX(page),edit_row);
      g_signal_connect(rename,"clicked",G_CALLBACK(rename_client_clicked),state);
      gtk_widget_set_sensitive(rename,state->store.db!=NULL);
      state->search_entry=gtk_search_entry_new();
      gtk_box_append(GTK_BOX(page),state->search_entry);
      g_signal_connect(state->search_entry,"search-changed",G_CALLBACK(on_search),state);
      state->client_list=gtk_list_box_new();
      gtk_box_append(GTK_BOX(page),state->client_list);
      g_signal_connect(save,"clicked",G_CALLBACK(add_client),state);
      if(state->store.db) refresh_clients(state);
      else gtk_label_set_text(GTK_LABEL(state->status),"Erro ao abrir SQLite. Cadastro indisponível.");
      gtk_widget_set_sensitive(save,state->store.db!=NULL);
    }else if(i==5){
      state->backup_entry=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->backup_entry),"Caminho completo do arquivo de backup .sqlite");
      gtk_box_append(GTK_BOX(page),state->backup_entry);
      GtkWidget *backup=gtk_button_new_with_label("Criar backup");
      GtkWidget *integrity=gtk_button_new_with_label("Verificar integridade");
      state->restore_entry=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->restore_entry),"Arquivo .sqlite para restaurar");
      gtk_box_append(GTK_BOX(page),state->restore_entry);
      GtkWidget *restore=gtk_button_new_with_label("Restaurar backup (substitui dados atuais)");
      gtk_box_append(GTK_BOX(page),restore);
      gtk_box_append(GTK_BOX(page),backup);
      gtk_box_append(GTK_BOX(page),integrity);
      state->settings_status=gtk_label_new("Prévia experimental: backups sem criptografia.");
      gtk_widget_set_halign(state->settings_status,GTK_ALIGN_START);
      gtk_box_append(GTK_BOX(page),state->settings_status);
      g_signal_connect(backup,"clicked",G_CALLBACK(backup_clicked),state);
      g_signal_connect(integrity,"clicked",G_CALLBACK(integrity_clicked),state);
      g_signal_connect(restore,"clicked",G_CALLBACK(restore_clicked),state);
      gtk_widget_set_sensitive(backup,state->store.db!=NULL);
      gtk_widget_set_sensitive(integrity,state->store.db!=NULL);
      gtk_widget_set_sensitive(restore,state->store.db!=NULL);
    }else{
      GtkWidget *note=gtk_label_new("Módulo em desenvolvimento. Não utilize dados clínicos reais.");
      gtk_widget_set_halign(note,GTK_ALIGN_START);
      gtk_box_append(GTK_BOX(page),note);
    }
    char *name=g_strdup_printf("page-%u",i);
    gtk_stack_add_named(GTK_STACK(stack),page,name);
    g_free(name);
    g_object_set_data(G_OBJECT(button),"target-page",page);
    g_signal_connect(button,"clicked",G_CALLBACK(navigate),stack);
    gtk_box_append(GTK_BOX(sidebar),button);
  }
  gtk_box_append(GTK_BOX(root),sidebar);
  gtk_box_append(GTK_BOX(root),gtk_separator_new(GTK_ORIENTATION_VERTICAL));
  gtk_widget_set_hexpand(stack,TRUE);
  gtk_box_append(GTK_BOX(root),stack);
  gtk_window_set_child(GTK_WINDOW(window),root);
  gtk_window_present(GTK_WINDOW(window));
}
int main(int argc,char **argv) {
  GtkApplication *app=gtk_application_new("br.com.evolufisico",G_APPLICATION_DEFAULT_FLAGS);
  g_signal_connect(app,"activate",G_CALLBACK(activate),NULL);
  int result=g_application_run(G_APPLICATION(app),argc,argv);
  g_object_unref(app);
  return result;
}
