#define MyAppName "EvoluFisico Desktop"
#define MyAppVersion "9.0.0-beta.1"
#define MyAppExeName "EvoluFisico.Desktop.exe"
[Setup]
AppId={{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
SetupIconFile=..\src\EvoluFisico.Desktop\Assets\EvoluFisico.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
DefaultDirName={autopf}\EvoluFisico Desktop
DefaultGroupName={#MyAppName}
OutputDir=..\installer-output
OutputBaseFilename=EvoluFisicoDesktop-9.0-Setup
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
[Files]
Source: "..\publish\win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; IconIndex: 0
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; IconIndex: 0
[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir EvoluFisico Desktop"; Flags: nowait postinstall skipifsilent
