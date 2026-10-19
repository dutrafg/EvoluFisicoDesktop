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
  GtkWidget *assessment_date;
  GtkWidget *assessment_weight;
  GtkWidget *assessment_height;
  GtkWidget *assessment_status;
  GtkWidget *assessment_list;
  GtkWidget *charge_cents;
  GtkWidget *charge_description;
  GtkWidget *charge_status;
  GtkWidget *charge_list;
  GtkWidget *assessment_picker;
  GtkWidget *charge_picker;
  GtkWidget *assessment_delete_id;
  GtkWidget *charge_delete_id;
  GtkWidget *client_delete_id;
  GtkWidget *client_scroll;
  GtkWidget *assessment_scroll;
  GtkWidget *charge_scroll;
} AppState;

static gboolean read_picker_id(GtkWidget *picker,gint64 *out) {
  const char *id=gtk_combo_box_get_active_id(GTK_COMBO_BOX(picker));
  if(!id || !*id)return FALSE;
  char *end=NULL;errno=0;
  gint64 parsed=g_ascii_strtoll(id,&end,10);
  if(errno==ERANGE || !end || *end || parsed<=0)return FALSE;
  *out=parsed;return TRUE;
}
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
static void refresh_pickers(AppState *state) {
  if(!state->assessment_picker || !state->charge_picker || !state->store.db)return;
  GtkComboBoxText *a=GTK_COMBO_BOX_TEXT(state->assessment_picker);
  GtkComboBoxText *b=GTK_COMBO_BOX_TEXT(state->charge_picker);
  char *selected_a=g_strdup(gtk_combo_box_get_active_id(GTK_COMBO_BOX(a)));
  char *selected_b=g_strdup(gtk_combo_box_get_active_id(GTK_COMBO_BOX(b)));
  gtk_combo_box_text_remove_all(a);gtk_combo_box_text_remove_all(b);
  GError *error=NULL;
  GPtrArray *rows=ef_store_client_choices(&state->store,&error);
  if(!rows) {g_warning("Erro ao atualizar seleção: %s",error ? error->message : "erro desconhecido");g_clear_error(&error);}
  else {
    for(guint i=0;i<rows->len;i++) {
      const char *row=g_ptr_array_index(rows,i);
      char *end=NULL;gint64 id=g_ascii_strtoll(row,&end,10);
      if(id<=0 || !end || *end!=' ')continue;
      char *key=g_strdup_printf("%" G_GINT64_FORMAT,id);
      gtk_combo_box_text_append(a,key,row);
      gtk_combo_box_text_append(b,key,row);
      g_free(key);
    }
    g_ptr_array_unref(rows);
  }
  if(selected_a)gtk_combo_box_set_active_id(GTK_COMBO_BOX(a),selected_a);
  if(selected_b)gtk_combo_box_set_active_id(GTK_COMBO_BOX(b),selected_b);
  g_free(selected_a);g_free(selected_b);
}
static void refresh_clients(AppState *state) {
  GtkWidget *child;
  while ((child=gtk_widget_get_first_child(state->client_list)))
    gtk_list_box_remove(GTK_LIST_BOX(state->client_list),child);
  GError *error=NULL;
  const char *query=state->search_entry ? gtk_editable_get_text(GTK_EDITABLE(state->search_entry)) : "";
  GPtrArray *clients=*query ? ef_store_search_clients(&state->store,query,&error) : ef_store_list_client_rows(&state->store,&error);
  if(!clients) {
    gtk_label_set_text(GTK_LABEL(state->status),error ? error->message : "Falha na consulta.");
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
  refresh_pickers(state);
}
static void fill_list(GtkWidget *list,GPtrArray *rows) {
  GtkWidget *child=NULL;
  while((child=gtk_widget_get_first_child(list)))gtk_list_box_remove(GTK_LIST_BOX(list),child);
  for(guint i=0;i<rows->len;i++) {
    GtkWidget *label=gtk_label_new(g_ptr_array_index(rows,i));
    gtk_widget_set_halign(label,GTK_ALIGN_START);
    gtk_widget_set_margin_top(label,7);
    gtk_widget_set_margin_bottom(label,7);
    gtk_list_box_append(GTK_LIST_BOX(list),label);
  }
}
static void refresh_assessments(AppState *state,gint64 client_id) {
  GError *error=NULL;
  GPtrArray *rows=ef_store_list_assessment_rows(&state->store,client_id,&error);
  if(rows) {fill_list(state->assessment_list,rows);g_ptr_array_unref(rows);}
  else {gtk_label_set_text(GTK_LABEL(state->assessment_status),error->message);g_clear_error(&error);}
}
static void refresh_charges(AppState *state,gint64 client_id) {
  GError *error=NULL;
  GPtrArray *rows=ef_store_list_charge_rows(&state->store,client_id,&error);
  if(rows) {fill_list(state->charge_list,rows);g_ptr_array_unref(rows);}
  else {gtk_label_set_text(GTK_LABEL(state->charge_status),error->message);g_clear_error(&error);}
}
static void show_assessments(GtkButton *button,gpointer data) {
  (void)button;AppState *state=data;gint64 id=0;
  if(!read_picker_id(state->assessment_picker,&id)) {
    gtk_label_set_text(GTK_LABEL(state->assessment_status),"Selecione um cliente.");return;
  }
  refresh_assessments(state,id);
}
static void show_charges(GtkButton *button,gpointer data) {
  (void)button;AppState *state=data;gint64 id=0;
  if(!read_picker_id(state->charge_picker,&id)) {
    gtk_label_set_text(GTK_LABEL(state->charge_status),"Selecione um cliente.");return;
  }
  refresh_charges(state,id);
}
static void delete_record_confirmed(GtkDialog *dialog,gint response,gpointer data) {
  AppState *state=data;
  gboolean assessment=GPOINTER_TO_INT(g_object_get_data(G_OBJECT(dialog),"assessment"));
  gtk_window_destroy(GTK_WINDOW(dialog));
  if(response!=GTK_RESPONSE_ACCEPT)return;
  GtkWidget *field=assessment ? state->assessment_delete_id : state->charge_delete_id;
  GtkWidget *status=assessment ? state->assessment_status : state->charge_status;
  GtkWidget *picker=assessment ? state->assessment_picker : state->charge_picker;
  gint64 id=0,client=0;
  if(!read_id(field,&id) || !read_picker_id(picker,&client)) {
    gtk_label_set_text(GTK_LABEL(status),"Selecione um cliente e informe o ID do registro.");return;
  }
  GError *error=NULL;
  gboolean owns=assessment ? ef_store_assessment_belongs_to(&state->store,id,client,&error) : ef_store_charge_belongs_to(&state->store,id,client,&error);
  if(!owns) {
    gtk_label_set_text(GTK_LABEL(status),error ? error->message : "Registro de outro cliente.");
    g_clear_error(&error);return;
  }
  gboolean ok=assessment ? ef_store_delete_assessment_for_client(&state->store,id,client,&error) : ef_store_delete_charge_for_client(&state->store,id,client,&error);
  if(ok) {
    gtk_label_set_text(GTK_LABEL(status),"Registro excluído.");
    if(assessment)refresh_assessments(state,client);else refresh_charges(state,client);
  }else{
    gtk_label_set_text(GTK_LABEL(status),error ? error->message : "Falha ao excluir.");
    g_clear_error(&error);
  }
}
static void delete_record_clicked(GtkButton *button,gpointer data) {
  AppState *state=data;
  gboolean assessment=GPOINTER_TO_INT(g_object_get_data(G_OBJECT(button),"assessment"));
  GtkWidget *field=assessment ? state->assessment_delete_id : state->charge_delete_id;
  gint64 id=0;
  gint64 selected_client=0;
  GtkWidget *picker=assessment ? state->assessment_picker : state->charge_picker;
  if(!read_id(field,&id) || !read_picker_id(picker,&selected_client)) {
    gtk_label_set_text(GTK_LABEL(assessment ? state->assessment_status : state->charge_status),"Selecione o cliente e informe um ID válido.");
    return;
  }
  GtkWidget *window=gtk_widget_get_ancestor(GTK_WIDGET(button),GTK_TYPE_WINDOW);
  GtkWidget *dialog=gtk_message_dialog_new(GTK_WINDOW(window),GTK_DIALOG_MODAL,GTK_MESSAGE_WARNING,GTK_BUTTONS_NONE,
    "Excluir permanentemente o registro %" G_GINT64_FORMAT "?",id);
  gtk_dialog_add_button(GTK_DIALOG(dialog),"Cancelar",GTK_RESPONSE_CANCEL);
  gtk_dialog_add_button(GTK_DIALOG(dialog),"Excluir",GTK_RESPONSE_ACCEPT);
  g_object_set_data(G_OBJECT(dialog),"assessment",GINT_TO_POINTER(assessment));
  g_signal_connect(dialog,"response",G_CALLBACK(delete_record_confirmed),state);
  gtk_window_present(GTK_WINDOW(dialog));
}
static void save_assessment(GtkButton *button,gpointer data) {
  (void)button;AppState *state=data;gint64 id=0;double weight=0,height=0;
  if(!read_picker_id(state->assessment_picker,&id) || !read_positive_double(state->assessment_weight,&weight) ||
     !read_positive_double(state->assessment_height,&height)) {
    gtk_label_set_text(GTK_LABEL(state->assessment_status),"Selecione um cliente e confira peso e altura.");return;
  }
  const char *date=gtk_editable_get_text(GTK_EDITABLE(state->assessment_date));
  GError *error=NULL;
  if(ef_store_add_assessment(&state->store,id,date,weight,height,&error)) {
    gtk_label_set_text(GTK_LABEL(state->assessment_status),"Avaliação registrada (sem criptografia).");
    refresh_assessments(state,id);
    gtk_editable_set_text(GTK_EDITABLE(state->assessment_weight),"");
    gtk_editable_set_text(GTK_EDITABLE(state->assessment_height),"");
  }else{
    gtk_label_set_text(GTK_LABEL(state->assessment_status),error->message);
    g_clear_error(&error);
  }
}
static void save_charge(GtkButton *button,gpointer data) {
  (void)button;AppState *state=data;gint64 id=0,cents=0;
  if(!read_picker_id(state->charge_picker,&id) || !read_id(state->charge_cents,&cents)) {
    gtk_label_set_text(GTK_LABEL(state->charge_status),"Selecione um cliente e informe o valor em centavos.");return;
  }
  const char *description=gtk_editable_get_text(GTK_EDITABLE(state->charge_description));
  GError *error=NULL;
  if(ef_store_add_charge(&state->store,id,cents,description,&error)) {
    gtk_label_set_text(GTK_LABEL(state->charge_status),"Cobrança registrada (sem criptografia).");
    refresh_charges(state,id);
    gtk_editable_set_text(GTK_EDITABLE(state->charge_cents),"");
    gtk_editable_set_text(GTK_EDITABLE(state->charge_description),"");
  }else{
    gtk_label_set_text(GTK_LABEL(state->charge_status),error->message);
    g_clear_error(&error);
  }
}
static void delete_client_confirmed(GtkDialog *dialog,gint response,gpointer data) {
  AppState *state=data;
  gint64 id=*(gint64*)g_object_get_data(G_OBJECT(dialog),"client-id");
  gtk_window_destroy(GTK_WINDOW(dialog));
  if(response!=GTK_RESPONSE_ACCEPT)return;
  GError *error=NULL;
  if(ef_store_delete_client(&state->store,id,&error)) {
    gtk_label_set_text(GTK_LABEL(state->status),"Cliente e registros associados excluídos.");
    refresh_clients(state);
  }else{
    gtk_label_set_text(GTK_LABEL(state->status),error ? error->message : "Erro na exclusão.");
    g_clear_error(&error);
  }
}
static void delete_client_clicked(GtkButton *button,gpointer data) {
  AppState *state=data;gint64 id=0;
  if(!read_id(state->client_delete_id,&id)) {
    gtk_label_set_text(GTK_LABEL(state->status),"Informe ID de cliente válido.");return;
  }
  GtkWidget *window=gtk_widget_get_ancestor(GTK_WIDGET(button),GTK_TYPE_WINDOW);
  GtkWidget *dialog=gtk_message_dialog_new(GTK_WINDOW(window),GTK_DIALOG_MODAL,GTK_MESSAGE_WARNING,GTK_BUTTONS_NONE,
    "Excluir cliente %" G_GINT64_FORMAT " e TODAS as avaliações e cobranças vinculadas?",id);
  gtk_dialog_add_button(GTK_DIALOG(dialog),"Cancelar",GTK_RESPONSE_CANCEL);
  gtk_dialog_add_button(GTK_DIALOG(dialog),"Excluir tudo",GTK_RESPONSE_ACCEPT);
  gint64 *id_copy=g_new(gint64,1);*id_copy=id;
  g_object_set_data_full(G_OBJECT(dialog),"client-id",id_copy,g_free);
  g_signal_connect(dialog,"response",G_CALLBACK(delete_client_confirmed),state);
  gtk_window_present(GTK_WINDOW(dialog));
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
      GtkWidget *delete_row=gtk_box_new(GTK_ORIENTATION_HORIZONTAL,8);
      state->client_delete_id=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->client_delete_id),"ID do cliente a excluir");
      GtkWidget *delete_client_button=gtk_button_new_with_label("Excluir cliente...");
      gtk_box_append(GTK_BOX(delete_row),state->client_delete_id);
      gtk_box_append(GTK_BOX(delete_row),delete_client_button);
      gtk_box_append(GTK_BOX(page),delete_row);
      g_signal_connect(delete_client_button,"clicked",G_CALLBACK(delete_client_clicked),state);
      gtk_widget_set_sensitive(delete_client_button,state->store.db!=NULL);
      state->search_entry=gtk_search_entry_new();
      gtk_box_append(GTK_BOX(page),state->search_entry);
      g_signal_connect(state->search_entry,"search-changed",G_CALLBACK(on_search),state);
      state->client_list=gtk_list_box_new();
      state->client_scroll=gtk_scrolled_window_new();
      gtk_widget_set_vexpand(state->client_scroll,TRUE);
      gtk_scrolled_window_set_child(GTK_SCROLLED_WINDOW(state->client_scroll),state->client_list);
      gtk_box_append(GTK_BOX(page),state->client_scroll);
      g_signal_connect(save,"clicked",G_CALLBACK(add_client),state);
      if(state->store.db) refresh_clients(state);
      else gtk_label_set_text(GTK_LABEL(state->status),"Erro ao abrir SQLite. Cadastro indisponível.");
      gtk_widget_set_sensitive(save,state->store.db!=NULL);
    }else if(i==2){
      state->assessment_picker=gtk_combo_box_text_new();
      state->assessment_date=gtk_entry_new();
      GDateTime *today=g_date_time_new_now_local();
      char *today_text=g_date_time_format(today,"%Y-%m-%d");
      gtk_editable_set_text(GTK_EDITABLE(state->assessment_date),today_text);
      g_free(today_text);g_date_time_unref(today);
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->assessment_date),"Data AAAA-MM-DD");
      state->assessment_weight=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->assessment_weight),"Peso em kg (ex.: 70.5)");
      state->assessment_height=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->assessment_height),"Altura em cm (ex.: 170)");
      gtk_box_append(GTK_BOX(page),state->assessment_picker);
      gtk_box_append(GTK_BOX(page),state->assessment_date);
      gtk_box_append(GTK_BOX(page),state->assessment_weight);
      gtk_box_append(GTK_BOX(page),state->assessment_height);
      GtkWidget *save_assessment_button=gtk_button_new_with_label("Registrar avaliação");
      gtk_box_append(GTK_BOX(page),save_assessment_button);
      state->assessment_status=gtk_label_new("Protótipo sem criptografia — apenas dados fictícios.");
      gtk_box_append(GTK_BOX(page),state->assessment_status);
      GtkWidget *show_assessments_button=gtk_button_new_with_label("Consultar avaliações");
      gtk_box_append(GTK_BOX(page),show_assessments_button);
      g_signal_connect(show_assessments_button,"clicked",G_CALLBACK(show_assessments),state);
      gtk_widget_set_sensitive(show_assessments_button,state->store.db!=NULL);
      state->assessment_delete_id=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->assessment_delete_id),"ID da avaliação a excluir");
      gtk_box_append(GTK_BOX(page),state->assessment_delete_id);
      GtkWidget *delete_assessment_button=gtk_button_new_with_label("Excluir avaliação...");
      g_object_set_data(G_OBJECT(delete_assessment_button),"assessment",GINT_TO_POINTER(TRUE));
      g_signal_connect(delete_assessment_button,"clicked",G_CALLBACK(delete_record_clicked),state);
      gtk_widget_set_sensitive(delete_assessment_button,state->store.db!=NULL);
      gtk_box_append(GTK_BOX(page),delete_assessment_button);
      state->assessment_list=gtk_list_box_new();
      state->assessment_scroll=gtk_scrolled_window_new();
      gtk_widget_set_vexpand(state->assessment_scroll,TRUE);
      gtk_scrolled_window_set_child(GTK_SCROLLED_WINDOW(state->assessment_scroll),state->assessment_list);
      gtk_box_append(GTK_BOX(page),state->assessment_scroll);
      g_signal_connect(save_assessment_button,"clicked",G_CALLBACK(save_assessment),state);
      gtk_widget_set_sensitive(save_assessment_button,state->store.db!=NULL);
    }else if(i==3){
      state->charge_picker=gtk_combo_box_text_new();
      state->charge_cents=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->charge_cents),"Valor em centavos (ex.: 2500 = R$ 25,00)");
      state->charge_description=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->charge_description),"Descrição do serviço");
      gtk_box_append(GTK_BOX(page),state->charge_picker);
      gtk_box_append(GTK_BOX(page),state->charge_cents);
      gtk_box_append(GTK_BOX(page),state->charge_description);
      GtkWidget *save_charge_button=gtk_button_new_with_label("Registrar cobrança");
      gtk_box_append(GTK_BOX(page),save_charge_button);
      state->charge_status=gtk_label_new("Protótipo sem criptografia — apenas dados fictícios.");
      gtk_box_append(GTK_BOX(page),state->charge_status);
      GtkWidget *show_charges_button=gtk_button_new_with_label("Consultar cobranças");
      gtk_box_append(GTK_BOX(page),show_charges_button);
      g_signal_connect(show_charges_button,"clicked",G_CALLBACK(show_charges),state);
      gtk_widget_set_sensitive(show_charges_button,state->store.db!=NULL);
      state->charge_delete_id=gtk_entry_new();
      gtk_entry_set_placeholder_text(GTK_ENTRY(state->charge_delete_id),"ID da cobrança a excluir");
      gtk_box_append(GTK_BOX(page),state->charge_delete_id);
      GtkWidget *delete_charge_button=gtk_button_new_with_label("Excluir cobrança...");
      g_object_set_data(G_OBJECT(delete_charge_button),"assessment",GINT_TO_POINTER(FALSE));
      g_signal_connect(delete_charge_button,"clicked",G_CALLBACK(delete_record_clicked),state);
      gtk_widget_set_sensitive(delete_charge_button,state->store.db!=NULL);
      gtk_box_append(GTK_BOX(page),delete_charge_button);
      state->charge_list=gtk_list_box_new();
      state->charge_scroll=gtk_scrolled_window_new();
      gtk_widget_set_vexpand(state->charge_scroll,TRUE);
      gtk_scrolled_window_set_child(GTK_SCROLLED_WINDOW(state->charge_scroll),state->charge_list);
      gtk_box_append(GTK_BOX(page),state->charge_scroll);
      g_signal_connect(save_charge_button,"clicked",G_CALLBACK(save_charge),state);
      gtk_widget_set_sensitive(save_charge_button,state->store.db!=NULL);
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
  refresh_pickers(state);
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
