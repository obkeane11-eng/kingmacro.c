export interface ExportAction {
  kind: 'key' | 'mouse';
  vk?: number;
  label?: string;
  button?: 'left' | 'right' | 'middle';
  enabled: boolean;
}

export interface ExportProfile {
  name: string;
  mode: 'toggle' | 'hold' | 'burst';
  cps: number;
  unlimited: boolean;
  holdMs: number;
  burstCount: number;
  hotkeyVk: number;
  hotkeyLabel: string;
  actions: ExportAction[];
}

export interface ExportAppConfig {
  appName: string;
  accent: string;
  robloxOnly: boolean;
  hudEnabled: boolean;
  hudOnlyRoblox: boolean;
  hudCenterDot: boolean;
  hudOpacity: number;
  delayS?: number;
  discordInviteUrl: string;
  discordWebhookUrl: string;
  selectedIndex: number;
  profiles: ExportProfile[];
}

// CRC32 table for valid standard ZIP archives
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildZipArchive(files: { name: string; content: string | Buffer }[]): Buffer {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const dataBuf = typeof file.content === 'string' ? Buffer.from(file.content, 'utf8') : file.content;
    const crc = crc32(dataBuf);
    const size = dataBuf.length;

    // Local file header (30 bytes + filename)
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 flag
    local.writeUInt16LE(0, 8); // store (no compression)
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    localChunks.push(local, nameBuf, dataBuf);

    // Central directory header (46 bytes + filename)
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);

    centralChunks.push(central, nameBuf);
    offset += local.length + nameBuf.length + dataBuf.length;
  }

  const centralDir = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralDir, eocd]);
}

const LAUNCH_BAT = `@echo off
setlocal
cd /d "%~dp0"
title kinglock113.cc Launcher

if exist "kinglock113.exe" (
    start "" "kinglock113.exe"
    exit /b 0
)

set "CSC=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
if not exist "%CSC%" set "CSC=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"

if not exist "%CSC%" (
    echo Could not find built-in Windows .NET compiler csc.exe.
    pause
    exit /b 1
)

echo Building kinglock113.exe for your Windows PC...
"%CSC%" /nologo /optimize+ /target:winexe /out:"kinglock113.exe" ^
  /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll /r:System.Web.Extensions.dll ^
  "KinglockMacro.cs"

if errorlevel 1 (
    echo Build failed. See errors above.
    pause
    exit /b 1
)

echo Launching kinglock113.exe...
start "" "kinglock113.exe"
exit /b 0
`;

const README_TXT = `kinglock113.cc — Native Windows Macro Application
==================================================

HOW TO OPEN AND USE IN-GAME:
1. Extract ALL files from this ZIP into a folder (for example, Desktop\\kinglock113).
   Do not run directly from inside the compressed ZIP preview.
2. Double-click "Launch_Kinglock113.bat".
   - On first run, it builds a native Windows executable ("kinglock113.exe")
     using Windows' built-in .NET compiler (takes ~1 second, no extra downloads).
   - If Windows SmartScreen appears, click "More info" -> "Run anyway".
3. Your profiles, hotkeys, CPS targets, and HUD overlay settings from kinglock113.cc
   are preloaded in "config.json".

IN-GAME CONTROLS:
- Clash (Hold): Hold Mouse 5 (or your configured hotkey) to fire F at 240/s.
- Slashes of Fury (Burst): Press Mouse 3 to fire 35 timed clicks.
- Auto Click (Toggle/Hold): Configured via Mouse 4 or F6.
- Roblox Window Guard: Enabled by default so hotkeys only fire while Roblox is focused.
- In-Game HUD Overlay: Click-through transparent overlay drawn on top of your game.

COMMUNITY & UPDATES:
- Discord: https://discord.gg/xZA6HzdXT
- Website: https://kinglock113.cc
`;

// C# 5 compatible native Windows macro + click-through HUD overlay
const KINGLOCK_CS = `using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace KinglockMacro
{
    internal static class Native
    {
        public const int INPUT_MOUSE = 0;
        public const int INPUT_KEYBOARD = 1;

        public const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
        public const uint KEYEVENTF_KEYUP = 0x0002;
        public const uint KEYEVENTF_SCANCODE = 0x0008;

        public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        public const uint MOUSEEVENTF_LEFTUP = 0x0004;
        public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;

        public const int WS_EX_LAYERED = 0x80000;
        public const int WS_EX_TRANSPARENT = 0x20;
        public const int WS_EX_TOOLWINDOW = 0x80;
        public const int WS_EX_NOACTIVATE = 0x08000000;

        [StructLayout(LayoutKind.Sequential)]
        public struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public uint mouseData;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct HARDWAREINPUT
        {
            public uint uMsg;
            public ushort wParamL;
            public ushort wParamH;
        }

        [StructLayout(LayoutKind.Explicit)]
        public struct InputUnion
        {
            [FieldOffset(0)] public MOUSEINPUT mi;
            [FieldOffset(0)] public KEYBDINPUT ki;
            [FieldOffset(0)] public HARDWAREINPUT hi;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct INPUT
        {
            public int type;
            public InputUnion U;
        }

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        public static extern uint MapVirtualKey(uint uCode, uint uMapType);

        [DllImport("user32.dll")]
        public static extern short GetAsyncKeyState(int vKey);

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

        [DllImport("winmm.dll")]
        public static extern uint timeBeginPeriod(uint period);

        [DllImport("winmm.dll")]
        public static extern uint timeEndPeriod(uint period);
    }

    public class ActionItem
    {
        public string kind { get; set; }
        public int vk { get; set; }
        public string label { get; set; }
        public string button { get; set; }
        public bool enabled { get; set; }
    }

    public class ProfileItem
    {
        public string name { get; set; }
        public string mode { get; set; }
        public int cps { get; set; }
        public bool unlimited { get; set; }
        public int holdMs { get; set; }
        public int burstCount { get; set; }
        public int hotkeyVk { get; set; }
        public string hotkeyLabel { get; set; }
        public List<ActionItem> actions { get; set; }
    }

    public class AppConfig
    {
        public string appName { get; set; }
        public string accent { get; set; }
        public bool robloxOnly { get; set; }
        public bool hudEnabled { get; set; }
        public bool hudOnlyRoblox { get; set; }
        public bool hudCenterDot { get; set; }
        public int hudOpacity { get; set; }
        public int delayS { get; set; }
        public string discordInviteUrl { get; set; }
        public string discordWebhookUrl { get; set; }
        public int selectedIndex { get; set; }
        public List<ProfileItem> profiles { get; set; }
    }

    public class HudOverlayForm : Form
    {
        private Label lblTitle;
        private Label lblStatus;
        private Panel centerDot;

        public HudOverlayForm()
        {
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            TopMost = true;
            StartPosition = FormStartPosition.Manual;
            BackColor = Color.Black;
            TransparencyKey = Color.Black;
            Bounds = Screen.PrimaryScreen.Bounds;

            Panel box = new Panel();
            box.BackColor = Color.FromArgb(16, 16, 20);
            box.Location = new Point(18, 18);
            box.Size = new Size(250, 56);
            box.Padding = new Padding(10, 8, 10, 8);

            lblTitle = new Label();
            lblTitle.ForeColor = Color.FromArgb(255, 90, 31);
            lblTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblTitle.Location = new Point(10, 7);
            lblTitle.Size = new Size(230, 18);
            lblTitle.Text = "KINGLOCK113.CC";

            lblStatus = new Label();
            lblStatus.ForeColor = Color.White;
            lblStatus.Font = new Font("Consolas", 9.5f, FontStyle.Regular);
            lblStatus.Location = new Point(10, 28);
            lblStatus.Size = new Size(230, 18);
            lblStatus.Text = "READY | 0/s";

            box.Controls.Add(lblTitle);
            box.Controls.Add(lblStatus);
            Controls.Add(box);

            centerDot = new Panel();
            centerDot.BackColor = Color.FromArgb(255, 90, 31);
            centerDot.Size = new Size(6, 6);
            centerDot.Location = new Point((Width - 6) / 2, (Height - 6) / 2);
            Controls.Add(centerDot);
        }

        protected override bool ShowWithoutActivation
        {
            get { return true; }
        }

        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                cp.ExStyle |= Native.WS_EX_LAYERED | Native.WS_EX_TRANSPARENT | Native.WS_EX_TOOLWINDOW | Native.WS_EX_NOACTIVATE;
                return cp;
            }
        }

        public void UpdateHud(string brand, Color accent, string profileName, string mode, int rate, bool active, bool showDot, int opacityPct)
        {
            lblTitle.ForeColor = accent;
            lblTitle.Text = brand.ToUpperInvariant() + "  (" + mode.ToUpperInvariant() + ")";
            lblStatus.Text = (active ? "ACTIVE  " : "READY   ") + profileName + "  " + rate + "/s";
            centerDot.BackColor = accent;
            centerDot.Visible = showDot;
            double op = Math.Max(0.25, Math.Min(1.0, opacityPct / 100.0));
            if (Math.Abs(Opacity - op) > 0.02) Opacity = op;
        }
    }

    public class MainForm : Form
    {
        private AppConfig cfg;
        private string configPath;
        private Color accentColor = Color.FromArgb(255, 90, 31);
        private HudOverlayForm hudForm;

        private Thread workerThread;
        private volatile bool appClosing = false;
        private volatile bool manualRunning = false;
        private volatile bool engineActive = false;
        private volatile int currentRate = 0;
        private volatile int currentJitterTenthsUs = 0;
        private volatile int liveProfileIndex = 0;
        private long totalInputs = 0;
        private int clashesCount = 0;
        private bool capturingHotkey = false;

        private ComboBox cmbProfiles;
        private ComboBox cmbMode;
        private NumericUpDown numCps;
        private NumericUpDown numHold;
        private NumericUpDown numBurst;
        private CheckBox chkUnlimited;
        private CheckBox chkRobloxOnly;
        private CheckBox chkHudEnabled;
        private CheckBox chkHudRoblox;
        private CheckBox chkHudDot;
        private Button btnHotkey;
        private Button btnStartStop;
        private Label lblRate;
        private Label lblTotal;
        private Label lblJitter;
        private Label lblRobloxState;
        private Label lblBench;
        private TextBox txtWebhook;
        private Label lblWebhookStatus;
        private ListBox lstActions;
        private System.Windows.Forms.Timer uiTimer;

        public MainForm()
        {
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; // TLS 1.2
            configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
            LoadConfig();

            Text = (string.IsNullOrEmpty(cfg.appName) ? "kinglock113.cc" : cfg.appName) + " — In-Game Macro";
            Size = new Size(760, 560);
            MinimumSize = new Size(720, 520);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(19, 19, 22);
            ForeColor = Color.FromArgb(237, 237, 238);
            Font = new Font("Segoe UI", 9.5f);
            KeyPreview = true;

            BuildUi();
            PopulateProfileFields();

            hudForm = new HudOverlayForm();

            Native.timeBeginPeriod(1);
            workerThread = new Thread(EngineLoop);
            workerThread.IsBackground = true;
            workerThread.Priority = ThreadPriority.Highest;
            workerThread.Start();

            uiTimer = new System.Windows.Forms.Timer();
            uiTimer.Interval = 80;
            uiTimer.Tick += OnUiTick;
            uiTimer.Start();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            appClosing = true;
            SaveConfig();
            Native.timeEndPeriod(1);
            if (hudForm != null && !hudForm.IsDisposed) hudForm.Close();
            base.OnFormClosing(e);
        }

        private void LoadConfig()
        {
            JavaScriptSerializer ser = new JavaScriptSerializer();
            if (File.Exists(configPath))
            {
                try
                {
                    string json = File.ReadAllText(configPath, Encoding.UTF8);
                    cfg = ser.Deserialize<AppConfig>(json);
                }
                catch { cfg = null; }
            }

            if (cfg == null || cfg.profiles == null || cfg.profiles.Count == 0)
            {
                cfg = new AppConfig();
                cfg.appName = "kinglock113.cc";
                cfg.accent = "#ff5a1f";
                cfg.robloxOnly = true;
                cfg.hudEnabled = true;
                cfg.hudOnlyRoblox = true;
                cfg.hudCenterDot = true;
                cfg.hudOpacity = 85;
                cfg.discordInviteUrl = "https://discord.gg/xZA6HzdXT";
                cfg.discordWebhookUrl = "";
                cfg.selectedIndex = 0;
                cfg.profiles = new List<ProfileItem>();

                ProfileItem p1 = new ProfileItem();
                p1.name = "Clash"; p1.mode = "hold"; p1.cps = 240; p1.holdMs = 1; p1.burstCount = 10;
                p1.hotkeyVk = 0x06; p1.hotkeyLabel = "Mouse 5";
                p1.actions = new List<ActionItem> { new ActionItem { kind = "key", vk = 0x46, label = "F", enabled = true } };
                cfg.profiles.Add(p1);

                ProfileItem p2 = new ProfileItem();
                p2.name = "Slashes of Fury"; p2.mode = "burst"; p2.cps = 40; p2.holdMs = 5; p2.burstCount = 35;
                p2.hotkeyVk = 0x04; p2.hotkeyLabel = "Mouse 3";
                p2.actions = new List<ActionItem> { new ActionItem { kind = "mouse", button = "left", enabled = true } };
                cfg.profiles.Add(p2);

                ProfileItem p3 = new ProfileItem();
                p3.name = "Auto Click"; p3.mode = "hold"; p3.cps = 60; p3.holdMs = 1; p3.burstCount = 10;
                p3.hotkeyVk = 0x05; p3.hotkeyLabel = "Mouse 4";
                p3.actions = new List<ActionItem> { new ActionItem { kind = "mouse", button = "left", enabled = true } };
                cfg.profiles.Add(p3);
            }

            try { accentColor = ColorTranslator.FromHtml(cfg.accent); }
            catch { accentColor = Color.FromArgb(255, 90, 31); }
        }

        private void SaveConfig()
        {
            try
            {
                JavaScriptSerializer ser = new JavaScriptSerializer();
                File.WriteAllText(configPath, ser.Serialize(cfg), Encoding.UTF8);
            }
            catch { }
        }

        private ProfileItem ActiveProfile()
        {
            if (cfg.selectedIndex < 0 || cfg.selectedIndex >= cfg.profiles.Count) cfg.selectedIndex = 0;
            return cfg.profiles[cfg.selectedIndex];
        }

        private void BuildUi()
        {
            Panel topBar = new Panel();
            topBar.Dock = DockStyle.Top;
            topBar.Height = 52;
            topBar.BackColor = Color.FromArgb(14, 14, 17);
            topBar.Padding = new Padding(16, 10, 16, 10);

            Label brand = new Label();
            brand.Text = (cfg.appName ?? "kinglock113.cc").ToUpperInvariant() + "  ·  WINDOWS IN-GAME MACRO";
            brand.Font = new Font("Segoe UI", 11f, FontStyle.Bold);
            brand.ForeColor = Color.White;
            brand.AutoSize = true;
            brand.Location = new Point(16, 15);
            topBar.Controls.Add(brand);

            Button btnDiscord = new Button();
            btnDiscord.Text = "Join Discord";
            btnDiscord.BackColor = Color.FromArgb(88, 101, 242);
            btnDiscord.ForeColor = Color.White;
            btnDiscord.FlatStyle = FlatStyle.Flat;
            btnDiscord.FlatAppearance.BorderSize = 0;
            btnDiscord.Size = new Size(105, 30);
            btnDiscord.Location = new Point(625, 11);
            btnDiscord.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnDiscord.Click += delegate {
                try { Process.Start(string.IsNullOrEmpty(cfg.discordInviteUrl) ? "https://discord.gg/xZA6HzdXT" : cfg.discordInviteUrl); } catch { }
            };
            topBar.Controls.Add(btnDiscord);
            Controls.Add(topBar);

            // Left Engine Panel
            Panel leftPanel = new Panel();
            leftPanel.Location = new Point(18, 68);
            leftPanel.Size = new Size(270, 435);
            leftPanel.BackColor = Color.FromArgb(26, 26, 31);
            Controls.Add(leftPanel);

            btnStartStop = new Button();
            btnStartStop.Text = "START";
            btnStartStop.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            btnStartStop.BackColor = Color.FromArgb(34, 34, 40);
            btnStartStop.ForeColor = Color.White;
            btnStartStop.FlatStyle = FlatStyle.Flat;
            btnStartStop.FlatAppearance.BorderColor = accentColor;
            btnStartStop.FlatAppearance.BorderSize = 2;
            btnStartStop.Size = new Size(234, 58);
            btnStartStop.Location = new Point(18, 18);
            btnStartStop.Click += delegate {
                if (manualRunning) { manualRunning = false; return; }
                if (cfg.delayS > 0)
                {
                    int sec = Math.Min(15, cfg.delayS);
                    btnStartStop.Text = "WAIT " + sec + "s";
                    Thread t = new Thread(delegate {
                        Thread.Sleep(sec * 1000);
                        if (!appClosing) manualRunning = true;
                    });
                    t.IsBackground = true;
                    t.Start();
                }
                else
                {
                    manualRunning = true;
                }
            };
            leftPanel.Controls.Add(btnStartStop);

            lblRate = new Label();
            lblRate.Text = "0 /s";
            lblRate.Font = new Font("Consolas", 24f, FontStyle.Bold);
            lblRate.ForeColor = accentColor;
            lblRate.Location = new Point(18, 90);
            lblRate.Size = new Size(234, 40);
            leftPanel.Controls.Add(lblRate);

            lblTotal = new Label();
            lblTotal.Text = "Total inputs: 0";
            lblTotal.Font = new Font("Consolas", 9.5f);
            lblTotal.ForeColor = Color.FromArgb(165, 165, 175);
            lblTotal.Location = new Point(18, 134);
            lblTotal.Size = new Size(234, 20);
            leftPanel.Controls.Add(lblTotal);

            lblJitter = new Label();
            lblJitter.Text = "Timer jitter: --";
            lblJitter.Font = new Font("Consolas", 9.5f);
            lblJitter.ForeColor = Color.FromArgb(165, 165, 175);
            lblJitter.Location = new Point(18, 156);
            lblJitter.Size = new Size(234, 20);
            leftPanel.Controls.Add(lblJitter);

            lblRobloxState = new Label();
            lblRobloxState.Text = "Target: Waiting for Roblox";
            lblRobloxState.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            lblRobloxState.ForeColor = Color.FromArgb(200, 200, 208);
            lblRobloxState.Location = new Point(18, 186);
            lblRobloxState.Size = new Size(234, 22);
            leftPanel.Controls.Add(lblRobloxState);

            chkRobloxOnly = new CheckBox();
            chkRobloxOnly.Text = "Roblox window guard (recommended)";
            chkRobloxOnly.Checked = cfg.robloxOnly;
            chkRobloxOnly.Location = new Point(18, 220);
            chkRobloxOnly.Size = new Size(238, 24);
            chkRobloxOnly.CheckedChanged += delegate { cfg.robloxOnly = chkRobloxOnly.Checked; SaveConfig(); };
            leftPanel.Controls.Add(chkRobloxOnly);

            chkHudEnabled = new CheckBox();
            chkHudEnabled.Text = "Enable click-through in-game HUD";
            chkHudEnabled.Checked = cfg.hudEnabled;
            chkHudEnabled.Location = new Point(18, 248);
            chkHudEnabled.Size = new Size(238, 24);
            chkHudEnabled.CheckedChanged += delegate { cfg.hudEnabled = chkHudEnabled.Checked; SaveConfig(); };
            leftPanel.Controls.Add(chkHudEnabled);

            chkHudRoblox = new CheckBox();
            chkHudRoblox.Text = "Show HUD only over Roblox";
            chkHudRoblox.Checked = cfg.hudOnlyRoblox;
            chkHudRoblox.Location = new Point(18, 274);
            chkHudRoblox.Size = new Size(238, 24);
            chkHudRoblox.CheckedChanged += delegate { cfg.hudOnlyRoblox = chkHudRoblox.Checked; SaveConfig(); };
            leftPanel.Controls.Add(chkHudRoblox);

            chkHudDot = new CheckBox();
            chkHudDot.Text = "HUD center dot reticle";
            chkHudDot.Checked = cfg.hudCenterDot;
            chkHudDot.Location = new Point(18, 300);
            chkHudDot.Size = new Size(238, 24);
            chkHudDot.CheckedChanged += delegate { cfg.hudCenterDot = chkHudDot.Checked; SaveConfig(); };
            leftPanel.Controls.Add(chkHudDot);

            Button btnBench = new Button();
            btnBench.Text = "Run PC Timer Benchmark";
            btnBench.BackColor = Color.FromArgb(34, 34, 40);
            btnBench.ForeColor = Color.White;
            btnBench.FlatStyle = FlatStyle.Flat;
            btnBench.Location = new Point(18, 340);
            btnBench.Size = new Size(234, 32);
            btnBench.Click += delegate { RunPcBenchmark(); };
            leftPanel.Controls.Add(btnBench);

            lblBench = new Label();
            lblBench.Text = "Click above to measure your PC timer vs Sleep().";
            lblBench.Font = new Font("Consolas", 8f);
            lblBench.ForeColor = Color.FromArgb(145, 145, 155);
            lblBench.Location = new Point(18, 380);
            lblBench.Size = new Size(234, 44);
            leftPanel.Controls.Add(lblBench);

            // Right Profile & Discord Panel
            Panel rightPanel = new Panel();
            rightPanel.Location = new Point(304, 68);
            rightPanel.Size = new Size(422, 435);
            rightPanel.BackColor = Color.FromArgb(26, 26, 31);
            Controls.Add(rightPanel);

            Label lProf = new Label { Text = "Active Profile", Location = new Point(18, 16), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lProf);

            cmbProfiles = new ComboBox();
            cmbProfiles.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbProfiles.BackColor = Color.FromArgb(19, 19, 22);
            cmbProfiles.ForeColor = Color.White;
            cmbProfiles.Location = new Point(18, 36);
            cmbProfiles.Size = new Size(240, 26);
            foreach (ProfileItem p in cfg.profiles) cmbProfiles.Items.Add(p.name);
            cmbProfiles.SelectedIndex = Math.Min(cfg.selectedIndex, cfg.profiles.Count - 1);
            cmbProfiles.SelectedIndexChanged += delegate {
                cfg.selectedIndex = cmbProfiles.SelectedIndex;
                manualRunning = false;
                PopulateProfileFields();
                SaveConfig();
            };
            rightPanel.Controls.Add(cmbProfiles);

            Button btnImport = new Button();
            btnImport.Text = "Paste KL1/BT1 Code";
            btnImport.BackColor = Color.FromArgb(34, 34, 40);
            btnImport.ForeColor = Color.White;
            btnImport.FlatStyle = FlatStyle.Flat;
            btnImport.Location = new Point(268, 35);
            btnImport.Size = new Size(136, 26);
            btnImport.Click += delegate { PromptImportShareCode(); };
            rightPanel.Controls.Add(btnImport);

            Label lMode = new Label { Text = "Mode", Location = new Point(18, 76), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lMode);
            cmbMode = new ComboBox();
            cmbMode.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbMode.BackColor = Color.FromArgb(19, 19, 22);
            cmbMode.ForeColor = Color.White;
            cmbMode.Items.AddRange(new object[] { "hold", "burst", "toggle" });
            cmbMode.Location = new Point(18, 96);
            cmbMode.Size = new Size(115, 26);
            cmbMode.SelectedIndexChanged += delegate {
                ActiveProfile().mode = cmbMode.SelectedItem.ToString();
                SaveConfig();
            };
            rightPanel.Controls.Add(cmbMode);

            Label lHk = new Label { Text = "Hotkey (click to rebind)", Location = new Point(148, 76), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lHk);
            btnHotkey = new Button();
            btnHotkey.BackColor = Color.FromArgb(19, 19, 22);
            btnHotkey.ForeColor = accentColor;
            btnHotkey.FlatStyle = FlatStyle.Flat;
            btnHotkey.Location = new Point(148, 95);
            btnHotkey.Size = new Size(130, 27);
            btnHotkey.Click += delegate {
                capturingHotkey = true;
                btnHotkey.Text = "Press key / M3-5...";
            };
            btnHotkey.MouseDown += OnHotkeyMouseDown;
            rightPanel.Controls.Add(btnHotkey);

            Label lCps = new Label { Text = "Speed (cycles/s)", Location = new Point(18, 134), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lCps);
            numCps = new NumericUpDown();
            numCps.Minimum = 1;
            numCps.Maximum = 5000;
            numCps.BackColor = Color.FromArgb(19, 19, 22);
            numCps.ForeColor = Color.White;
            numCps.Location = new Point(18, 154);
            numCps.Size = new Size(90, 25);
            numCps.ValueChanged += delegate { ActiveProfile().cps = (int)numCps.Value; SaveConfig(); };
            rightPanel.Controls.Add(numCps);

            Label lHold = new Label { Text = "Hold (ms)", Location = new Point(122, 134), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lHold);
            numHold = new NumericUpDown();
            numHold.Minimum = 0;
            numHold.Maximum = 500;
            numHold.BackColor = Color.FromArgb(19, 19, 22);
            numHold.ForeColor = Color.White;
            numHold.Location = new Point(122, 154);
            numHold.Size = new Size(76, 25);
            numHold.ValueChanged += delegate { ActiveProfile().holdMs = (int)numHold.Value; SaveConfig(); };
            rightPanel.Controls.Add(numHold);

            Label lBurst = new Label { Text = "Burst count", Location = new Point(210, 134), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lBurst);
            numBurst = new NumericUpDown();
            numBurst.Minimum = 1;
            numBurst.Maximum = 1000;
            numBurst.BackColor = Color.FromArgb(19, 19, 22);
            numBurst.ForeColor = Color.White;
            numBurst.Location = new Point(210, 154);
            numBurst.Size = new Size(76, 25);
            numBurst.ValueChanged += delegate { ActiveProfile().burstCount = (int)numBurst.Value; SaveConfig(); };
            rightPanel.Controls.Add(numBurst);

            chkUnlimited = new CheckBox();
            chkUnlimited.Text = "Unlimited";
            chkUnlimited.Location = new Point(300, 156);
            chkUnlimited.Size = new Size(100, 22);
            chkUnlimited.CheckedChanged += delegate { ActiveProfile().unlimited = chkUnlimited.Checked; SaveConfig(); };
            rightPanel.Controls.Add(chkUnlimited);

            Label lAct = new Label { Text = "Profile Inputs Fired (Win32 SendInput)", Location = new Point(18, 192), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lAct);

            lstActions = new ListBox();
            lstActions.BackColor = Color.FromArgb(19, 19, 22);
            lstActions.ForeColor = Color.White;
            lstActions.BorderStyle = BorderStyle.FixedSingle;
            lstActions.Location = new Point(18, 212);
            lstActions.Size = new Size(386, 72);
            rightPanel.Controls.Add(lstActions);

            Button btnAddLeft = new Button { Text = "+ Left Click", Location = new Point(18, 290), Size = new Size(92, 26), BackColor = Color.FromArgb(34, 34, 40), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAddLeft.Click += delegate { AddAction(new ActionItem { kind = "mouse", button = "left", enabled = true }); };
            rightPanel.Controls.Add(btnAddLeft);

            Button btnAddF = new Button { Text = "+ Key F", Location = new Point(116, 290), Size = new Size(78, 26), BackColor = Color.FromArgb(34, 34, 40), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAddF.Click += delegate { AddAction(new ActionItem { kind = "key", vk = 0x46, label = "F", enabled = true }); };
            rightPanel.Controls.Add(btnAddF);

            Button btnClearAct = new Button { Text = "Reset Inputs", Location = new Point(312, 290), Size = new Size(92, 26), BackColor = Color.FromArgb(34, 34, 40), ForeColor = Color.LightGray, FlatStyle = FlatStyle.Flat };
            btnClearAct.Click += delegate {
                ActiveProfile().actions = new List<ActionItem> { new ActionItem { kind = "key", vk = 0x46, label = "F", enabled = true } };
                PopulateProfileFields();
                SaveConfig();
            };
            rightPanel.Controls.Add(btnClearAct);

            Label lWh = new Label { Text = "Discord Channel Webhook (optional)", Location = new Point(18, 332), AutoSize = true, ForeColor = Color.Gray };
            rightPanel.Controls.Add(lWh);

            txtWebhook = new TextBox();
            txtWebhook.BackColor = Color.FromArgb(19, 19, 22);
            txtWebhook.ForeColor = Color.White;
            txtWebhook.Location = new Point(18, 352);
            txtWebhook.Size = new Size(276, 24);
            txtWebhook.Text = cfg.discordWebhookUrl ?? "";
            txtWebhook.TextChanged += delegate { cfg.discordWebhookUrl = txtWebhook.Text; SaveConfig(); };
            rightPanel.Controls.Add(txtWebhook);

            Button btnSendDiscord = new Button();
            btnSendDiscord.Text = "Post Stats";
            btnSendDiscord.BackColor = accentColor;
            btnSendDiscord.ForeColor = Color.Black;
            btnSendDiscord.FlatStyle = FlatStyle.Flat;
            btnSendDiscord.Location = new Point(302, 351);
            btnSendDiscord.Size = new Size(102, 26);
            btnSendDiscord.Click += delegate { PostWebhookStats(); };
            rightPanel.Controls.Add(btnSendDiscord);

            lblWebhookStatus = new Label { Text = "", Location = new Point(18, 384), Size = new Size(386, 36), ForeColor = Color.LightGray, Font = new Font("Segoe UI", 8.5f) };
            rightPanel.Controls.Add(lblWebhookStatus);
        }

        private void AddAction(ActionItem item)
        {
            if (ActiveProfile().actions == null) ActiveProfile().actions = new List<ActionItem>();
            ActiveProfile().actions.Add(item);
            PopulateProfileFields();
            SaveConfig();
        }

        private void PopulateProfileFields()
        {
            ProfileItem p = ActiveProfile();
            cmbMode.SelectedItem = p.mode ?? "hold";
            numCps.Value = Math.Max(1, Math.Min(5000, p.cps));
            numHold.Value = Math.Max(0, Math.Min(500, p.holdMs));
            numBurst.Value = Math.Max(1, Math.Min(1000, p.burstCount));
            chkUnlimited.Checked = p.unlimited;
            btnHotkey.Text = string.IsNullOrEmpty(p.hotkeyLabel) ? "F6" : p.hotkeyLabel;

            lstActions.Items.Clear();
            if (p.actions != null)
            {
                foreach (ActionItem a in p.actions)
                {
                    if (!a.enabled) continue;
                    if (a.kind == "mouse") lstActions.Items.Add("Mouse: " + (a.button ?? "left") + " click");
                    else lstActions.Items.Add("Key: " + (a.label ?? ("VK_" + a.vk)));
                }
            }
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            if (capturingHotkey)
            {
                e.SuppressKeyPress = true;
                e.Handled = true;
                capturingHotkey = false;
                if (e.KeyCode != Keys.Escape)
                {
                    ActiveProfile().hotkeyVk = (int)e.KeyCode;
                    ActiveProfile().hotkeyLabel = e.KeyCode.ToString();
                    btnHotkey.Text = ActiveProfile().hotkeyLabel;
                    SaveConfig();
                }
                else
                {
                    btnHotkey.Text = ActiveProfile().hotkeyLabel;
                }
                return;
            }
            base.OnKeyDown(e);
        }

        private void OnHotkeyMouseDown(object sender, MouseEventArgs e)
        {
            if (!capturingHotkey) return;
            int vk = 0;
            string lbl = null;
            if (e.Button == MouseButtons.Middle) { vk = 0x04; lbl = "Mouse 3"; }
            else if (e.Button == MouseButtons.XButton1) { vk = 0x05; lbl = "Mouse 4"; }
            else if (e.Button == MouseButtons.XButton2) { vk = 0x06; lbl = "Mouse 5"; }
            if (vk != 0)
            {
                capturingHotkey = false;
                ActiveProfile().hotkeyVk = vk;
                ActiveProfile().hotkeyLabel = lbl;
                btnHotkey.Text = lbl;
                SaveConfig();
            }
        }

        private void PromptImportShareCode()
        {
            string code = Clipboard.ContainsText() ? Clipboard.GetText().Trim() : "";
            if (!code.StartsWith("KL1:") && !code.StartsWith("BT1:"))
            {
                MessageBox.Show("Copy a KL1: or BT1: profile share code to your clipboard first, then click this button.", "Import Share Code", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            try
            {
                byte[] bytes = Convert.FromBase64String(code.Substring(4));
                string json = Encoding.UTF8.GetString(bytes);
                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> obj = ser.Deserialize<Dictionary<string, object>>(json);
                ProfileItem np = new ProfileItem();
                np.name = obj.ContainsKey("name") ? Convert.ToString(obj["name"]) : "Imported";
                np.mode = obj.ContainsKey("mode") ? Convert.ToString(obj["mode"]) : "hold";
                np.cps = obj.ContainsKey("cps") ? Convert.ToInt32(obj["cps"]) : 144;
                np.holdMs = obj.ContainsKey("holdMs") ? Convert.ToInt32(obj["holdMs"]) : 1;
                np.burstCount = obj.ContainsKey("burstCount") ? Convert.ToInt32(obj["burstCount"]) : 10;
                np.unlimited = obj.ContainsKey("unlimited") && Convert.ToBoolean(obj["unlimited"]);
                np.hotkeyVk = 0x77;
                np.hotkeyLabel = "F8";
                np.actions = new List<ActionItem>();
                object[] rawActions = obj.ContainsKey("actions") ? (obj["actions"] as object[]) : null;
                if (rawActions != null)
                {
                    foreach (object ra in rawActions)
                    {
                        Dictionary<string, object> d = ra as Dictionary<string, object>;
                        if (d == null) continue;
                        ActionItem ai = new ActionItem();
                        ai.kind = d.ContainsKey("kind") ? Convert.ToString(d["kind"]) : "key";
                        ai.vk = d.ContainsKey("vk") ? Convert.ToInt32(d["vk"]) : 0x46;
                        ai.label = d.ContainsKey("label") ? Convert.ToString(d["label"]) : "F";
                        ai.button = d.ContainsKey("button") ? Convert.ToString(d["button"]) : "left";
                        ai.enabled = !d.ContainsKey("enabled") || Convert.ToBoolean(d["enabled"]);
                        np.actions.Add(ai);
                    }
                }
                if (np.actions.Count == 0) np.actions.Add(new ActionItem { kind = "key", vk = 0x46, label = "F", enabled = true });
                cfg.profiles.Add(np);
                cmbProfiles.Items.Add(np.name);
                cmbProfiles.SelectedIndex = cfg.profiles.Count - 1;
                SaveConfig();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to import share code: " + ex.Message, "Import Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void RunPcBenchmark()
        {
            Stopwatch sw = Stopwatch.StartNew();
            int ticks = 0;
            double maxErrUs = 0;
            double targetStepMs = 1000.0 / 240.0;
            double nextDeadline = targetStepMs;
            while (sw.Elapsed.TotalMilliseconds < 120.0)
            {
                double now = sw.Elapsed.TotalMilliseconds;
                if (now >= nextDeadline)
                {
                    double errUs = Math.Abs(now - nextDeadline) * 1000.0;
                    if (errUs > maxErrUs) maxErrUs = errUs;
                    ticks++;
                    nextDeadline += targetStepMs;
                }
                else if (nextDeadline - now > 2.0)
                {
                    Thread.Sleep(1);
                }
            }
            double achieved = ticks / 0.120;
            lblBench.Text = string.Format("Stopwatch: {0:F1}/s (max err {1:F1} us) vs Sleep(15) ~64/s", achieved, maxErrUs);
        }

        private void PostWebhookStats()
        {
            string url = (txtWebhook.Text ?? "").Trim();
            if (!url.StartsWith("https://discord.com/api/webhooks/") && !url.StartsWith("https://discordapp.com/api/webhooks/"))
            {
                lblWebhookStatus.Text = "Enter a valid Discord webhook URL first.";
                return;
            }
            try
            {
                ProfileItem p = ActiveProfile();
                Dictionary<string, object> embed = new Dictionary<string, object>();
                embed["title"] = "In-Game Session Report";
                embed["description"] = string.Format("Profile **{0}** · {1}/s · Total inputs: **{2}** · Clashes: **{3}**", p.name ?? "Clash", p.cps, totalInputs, clashesCount);
                embed["color"] = 16734751;
                Dictionary<string, object> body = new Dictionary<string, object>();
                body["username"] = cfg.appName ?? "kinglock113.cc";
                body["embeds"] = new object[] { embed };
                JavaScriptSerializer ser = new JavaScriptSerializer();
                string payload = ser.Serialize(body);
                using (WebClient wc = new WebClient())
                {
                    wc.Encoding = Encoding.UTF8;
                    wc.Headers[HttpRequestHeader.ContentType] = "application/json";
                    wc.UploadString(url, "POST", payload);
                }
                lblWebhookStatus.Text = "Posted session report to your Discord channel.";
            }
            catch (Exception ex)
            {
                lblWebhookStatus.Text = "Webhook error: " + ex.Message;
            }
        }

        private bool IsRobloxFocused()
        {
            IntPtr h = Native.GetForegroundWindow();
            if (h == IntPtr.Zero) return false;
            StringBuilder sb = new StringBuilder(256);
            Native.GetWindowText(h, sb, sb.Capacity);
            return sb.ToString().IndexOf("Roblox", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private void FireCycle(ProfileItem p)
        {
            if (p.actions == null) return;
            List<Native.INPUT> downInputs = new List<Native.INPUT>();
            List<Native.INPUT> upInputs = new List<Native.INPUT>();
            IntPtr tag = new IntPtr(0x4B4C3133);

            foreach (ActionItem a in p.actions)
            {
                if (!a.enabled) continue;
                if (a.kind == "mouse")
                {
                    uint dFlag = Native.MOUSEEVENTF_LEFTDOWN;
                    uint uFlag = Native.MOUSEEVENTF_LEFTUP;
                    if (a.button == "right") { dFlag = Native.MOUSEEVENTF_RIGHTDOWN; uFlag = Native.MOUSEEVENTF_RIGHTUP; }
                    else if (a.button == "middle") { dFlag = Native.MOUSEEVENTF_MIDDLEDOWN; uFlag = Native.MOUSEEVENTF_MIDDLEUP; }

                    Native.INPUT d = new Native.INPUT { type = Native.INPUT_MOUSE };
                    d.U.mi.dwFlags = dFlag;
                    d.U.mi.dwExtraInfo = tag;
                    downInputs.Add(d);

                    Native.INPUT u = new Native.INPUT { type = Native.INPUT_MOUSE };
                    u.U.mi.dwFlags = uFlag;
                    u.U.mi.dwExtraInfo = tag;
                    upInputs.Add(u);
                }
                else
                {
                    ushort vk = (ushort)a.vk;
                    ushort scan = (ushort)Native.MapVirtualKey(vk, 0);

                    Native.INPUT d = new Native.INPUT { type = Native.INPUT_KEYBOARD };
                    d.U.ki.wVk = vk;
                    d.U.ki.wScan = scan;
                    d.U.ki.dwFlags = 0;
                    d.U.ki.dwExtraInfo = tag;
                    downInputs.Add(d);

                    Native.INPUT u = new Native.INPUT { type = Native.INPUT_KEYBOARD };
                    u.U.ki.wVk = vk;
                    u.U.ki.wScan = scan;
                    u.U.ki.dwFlags = Native.KEYEVENTF_KEYUP;
                    u.U.ki.dwExtraInfo = tag;
                    upInputs.Add(u);
                }
            }

            if (downInputs.Count > 0)
            {
                int sz = Marshal.SizeOf(typeof(Native.INPUT));
                Native.SendInput((uint)downInputs.Count, downInputs.ToArray(), sz);
                if (p.holdMs > 0) Thread.Sleep(p.holdMs);
                Native.SendInput((uint)upInputs.Count, upInputs.ToArray(), sz);
                Interlocked.Add(ref totalInputs, downInputs.Count);
            }
        }

        private void EngineLoop()
        {
            Stopwatch sw = Stopwatch.StartNew();
            Stopwatch rateWindow = Stopwatch.StartNew();
            int windowCount = 0;
            bool[] prevDown = new bool[64];
            bool[] toggleArmed = new bool[64];
            int[] burstRemaining = new int[64];
            double nextDeadlineMs = 0;

            while (!appClosing)
            {
                int count = cfg.profiles.Count;
                int selIdx = cfg.selectedIndex;
                if (selIdx < 0 || selIdx >= count) selIdx = 0;

                bool robloxOk = !cfg.robloxOnly || IsRobloxFocused();
                int runIndex = -1;

                if (!robloxOk)
                {
                    for (int i = 0; i < count && i < 64; i++)
                    {
                        toggleArmed[i] = false;
                        burstRemaining[i] = 0;
                        prevDown[i] = false;
                    }
                }
                else
                {
                    for (int i = 0; i < count && i < 64; i++)
                    {
                        ProfileItem prof = cfg.profiles[i];
                        bool hkDown = !capturingHotkey && prof.hotkeyVk > 0 && (Native.GetAsyncKeyState(prof.hotkeyVk) & 0x8000) != 0;
                        bool justPressed = hkDown && !prevDown[i];
                        prevDown[i] = hkDown;

                        if (prof.mode == "toggle")
                        {
                            if (justPressed) toggleArmed[i] = !toggleArmed[i];
                            if (toggleArmed[i] && runIndex == -1) runIndex = i;
                        }
                        else if (prof.mode == "burst")
                        {
                            if (justPressed) burstRemaining[i] = Math.Max(1, prof.burstCount);
                            if (burstRemaining[i] > 0 && runIndex == -1) runIndex = i;
                        }
                        else
                        {
                            if (justPressed) Interlocked.Increment(ref clashesCount);
                            if (hkDown && runIndex == -1) runIndex = i;
                        }
                    }
                }

                if (manualRunning && runIndex == -1) runIndex = selIdx;

                bool shouldRun = runIndex != -1;
                engineActive = shouldRun;
                liveProfileIndex = shouldRun ? runIndex : selIdx;

                if (shouldRun)
                {
                    ProfileItem p = cfg.profiles[runIndex];
                    double nowMs = sw.Elapsed.TotalMilliseconds;
                    double intervalMs = p.unlimited ? 0.5 : (1000.0 / Math.Max(1, p.cps));
                    if (nextDeadlineMs < nowMs - 50.0) nextDeadlineMs = nowMs;

                    if (nowMs >= nextDeadlineMs)
                    {
                        currentJitterTenthsUs = (int)Math.Round(Math.Abs(nowMs - nextDeadlineMs) * 10000.0);
                        FireCycle(p);
                        windowCount++;
                        if (p.mode == "burst" && runIndex < 64 && burstRemaining[runIndex] > 0) burstRemaining[runIndex]--;
                        nextDeadlineMs += intervalMs;
                    }
                    else
                    {
                        double rem = nextDeadlineMs - nowMs;
                        if (rem > 2.0) Thread.Sleep(1);
                    }
                }
                else
                {
                    nextDeadlineMs = sw.Elapsed.TotalMilliseconds;
                    Thread.Sleep(4);
                }

                if (rateWindow.ElapsedMilliseconds >= 250)
                {
                    currentRate = (int)Math.Round(windowCount * (1000.0 / rateWindow.ElapsedMilliseconds));
                    windowCount = 0;
                    rateWindow.Restart();
                }
            }
        }

        private void OnUiTick(object sender, EventArgs e)
        {
            int idx = liveProfileIndex;
            if (idx < 0 || idx >= cfg.profiles.Count) idx = 0;
            ProfileItem p = cfg.profiles[idx];
            bool rbx = IsRobloxFocused();

            btnStartStop.Text = manualRunning ? "STOP" : "START";
            btnStartStop.BackColor = (manualRunning || engineActive) ? accentColor : Color.FromArgb(34, 34, 40);
            btnStartStop.ForeColor = (manualRunning || engineActive) ? Color.Black : Color.White;

            lblRate.Text = currentRate + " /s";
            lblTotal.Text = "Total inputs: " + Interlocked.Read(ref totalInputs).ToString("N0");
            lblJitter.Text = engineActive ? string.Format("Timer jitter: +/-{0:F1} us", currentJitterTenthsUs / 10.0) : "Timer jitter: --";
            lblRobloxState.Text = cfg.robloxOnly
                ? (rbx ? "Target: Roblox focused (live)" : "Target: Waiting for Roblox focus")
                : "Target: Any active window";

            if (hudForm != null && !hudForm.IsDisposed)
            {
                bool showHud = cfg.hudEnabled && (!cfg.hudOnlyRoblox || rbx);
                if (showHud)
                {
                    if (!hudForm.Visible) hudForm.Show();
                    hudForm.UpdateHud(cfg.appName ?? "kinglock113.cc", accentColor, p.name, p.mode ?? "hold", currentRate, engineActive, cfg.hudCenterDot, cfg.hudOpacity);
                }
                else
                {
                    if (hudForm.Visible) hudForm.Hide();
                }
            }
        }
    }

    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
`;

export function createWindowsAppZip(config: ExportAppConfig): Buffer {
  const safeJson = JSON.stringify(config, null, 2);
  return buildZipArchive([
    { name: 'kinglock113/Launch_Kinglock113.bat', content: LAUNCH_BAT.replace(/\n/g, '\r\n') },
    { name: 'kinglock113/KinglockMacro.cs', content: KINGLOCK_CS.replace(/\n/g, '\r\n') },
    { name: 'kinglock113/config.json', content: safeJson },
    { name: 'kinglock113/README.txt', content: README_TXT.replace(/\n/g, '\r\n') },
  ]);
}
