project('evolufisico-linux', 'c', version: '0.1.0', default_options: ['warning_level=2', 'c_std=c11'])
gtk = dependency('gtk4', version: '>=4.6')
executable('evolufisico-linux', 'src/main.c', dependencies: [gtk], install: true)
install_data('data/br.com.evolufisico.desktop', install_dir: get_option('datadir') / 'applications')
