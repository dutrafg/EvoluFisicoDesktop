#define MyAppName "EvoluFisico Desktop - EFI Alpha"
#define MyAppVersion "1.0.13.0"
#define MyAppExeName "EvoluFisico.Desktop.exe"
[Setup]
AppId={{52CBAC3A-3D68-4A93-B0D2-0432BA821C35}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
SetupIconFile=..\src\EvoluFisico.Desktop\Assets\EvoluFisico.ico
UninstallDisplayIcon={app}\EvoluFisico.ico
DefaultDirName={autopf}\EvoluFisico Desktop EFI Alpha
DefaultGroupName={#MyAppName}
OutputDir=..\installer-output
OutputBaseFilename=EvoluFisico_EFI_Alpha_Setup
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
[Files]
Source: "..\publish\win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\src\EvoluFisico.Desktop\Assets\EvoluFisico.ico"; DestDir: "{app}"; Flags: ignoreversion
[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\EvoluFisico.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\EvoluFisico.ico"
[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir EvoluFisico Desktop EFI Alpha"; Flags: nowait postinstall skipifsilent
