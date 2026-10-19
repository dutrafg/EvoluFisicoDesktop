#include <gtk/gtk.h>
#include "storage.h"

typedef struct {
  EfStore store;
  GtkWidget *client_list;
  GtkWidget *client_entry;
  GtkWidget *status;
} AppState;

static void refresh_clients(AppState *state) {
  GtkWidget *child;
  while ((child=gtk_widget_get_first_child(state->client_list)))
    gtk_list_box_remove(GTK_LIST_BOX(state->client_list),child);
  GError *error=NULL;
  GPtrArray *clients=ef_store_list_clients(&state->store,&error);
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
      state->client_list=gtk_list_box_new();
      gtk_box_append(GTK_BOX(page),state->client_list);
      g_signal_connect(save,"clicked",G_CALLBACK(add_client),state);
      if(state->store.db) refresh_clients(state);
      else gtk_label_set_text(GTK_LABEL(state->status),"Erro ao abrir SQLite. Cadastro indisponível.");
      gtk_widget_set_sensitive(save,state->store.db!=NULL);
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
