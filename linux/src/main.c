#include <gtk/gtk.h>

static void navigate(GtkButton *button, gpointer user_data) {
  GtkStack *stack = GTK_STACK(user_data);
  GtkWidget *page = GTK_WIDGET(g_object_get_data(G_OBJECT(button), "target-page"));
  gtk_stack_set_visible_child(stack, page);
}

static void activate(GtkApplication *app, gpointer user_data) {
  (void)user_data;
  GtkWidget *window = gtk_application_window_new(app);
  gtk_window_set_title(GTK_WINDOW(window), "EvoluFisico Linux — Prévia GTK4");
  gtk_window_set_default_size(GTK_WINDOW(window), 1100, 720);

  GtkWidget *root = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0);
  GtkWidget *sidebar = gtk_box_new(GTK_ORIENTATION_VERTICAL, 14);
  gtk_widget_set_size_request(sidebar, 240, -1);
  gtk_widget_set_margin_start(sidebar, 20);
  gtk_widget_set_margin_end(sidebar, 20);
  gtk_widget_set_margin_top(sidebar, 30);
  GtkWidget *brand = gtk_label_new("EvoluFisico");
  gtk_widget_add_css_class(brand, "title-2");
  gtk_box_append(GTK_BOX(sidebar), brand);
  const char *items[] = {"Início", "Clientes", "Avaliações", "Cobranças", "Relatórios", "Configurações"};
  GtkWidget *stack = gtk_stack_new();
  gtk_stack_set_transition_type(GTK_STACK(stack), GTK_STACK_TRANSITION_TYPE_SLIDE_LEFT_RIGHT);
  for (guint i = 0; i < G_N_ELEMENTS(items); ++i) {
    GtkWidget *button = gtk_button_new_with_label(items[i]);
    GtkWidget *page = gtk_box_new(GTK_ORIENTATION_VERTICAL, 14);
    gtk_widget_set_margin_start(page, 32);
    gtk_widget_set_margin_top(page, 40);
    GtkWidget *heading = gtk_label_new(items[i]);
    gtk_widget_add_css_class(heading, "title-1");
    gtk_widget_set_halign(heading, GTK_ALIGN_START);
    gtk_box_append(GTK_BOX(page), heading);
    GtkWidget *note = gtk_label_new("Módulo em desenvolvimento. Nenhum dado clínico é salvo nesta prévia.");
    gtk_widget_set_halign(note, GTK_ALIGN_START);
    gtk_box_append(GTK_BOX(page), note);
    char *name = g_strdup_printf("page-%u", i);
    gtk_stack_add_named(GTK_STACK(stack), page, name);
    g_free(name);
    g_object_set_data(G_OBJECT(button), "target-page", page);
    g_signal_connect(button, "clicked", G_CALLBACK(navigate), stack);
    gtk_box_append(GTK_BOX(sidebar), button);
  }
  gtk_box_append(GTK_BOX(root), sidebar);
  GtkWidget *separator = gtk_separator_new(GTK_ORIENTATION_VERTICAL);
  gtk_box_append(GTK_BOX(root), separator);
  gtk_widget_set_hexpand(stack, TRUE);
  gtk_box_append(GTK_BOX(root), stack);
  gtk_window_set_child(GTK_WINDOW(window), root);
  gtk_window_present(GTK_WINDOW(window));
}
int main(int argc, char **argv) {
  GtkApplication *app = gtk_application_new("br.com.evolufisico", G_APPLICATION_DEFAULT_FLAGS);
  g_signal_connect(app, "activate", G_CALLBACK(activate), NULL);
  int result = g_application_run(G_APPLICATION(app), argc, argv);
  g_object_unref(app);
  return result;
}
