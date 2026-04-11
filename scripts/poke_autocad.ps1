# poke_autocad.ps1 — Send "(c:yqmcp-dispatch)" keystrokes to AutoCAD
# Uses SetForegroundWindow + SendKeys as fallback for AutoCAD 2024

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

public class AcadPoke {
    [DllImport("user32.dll")]
    static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);

    [DllImport("user32.dll")]
    static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int maxCount);

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public static bool Send() {
        IntPtr acadWnd = IntPtr.Zero;

        EnumWindows((hWnd, lp) => {
            if (!IsWindowVisible(hWnd)) return true;
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().ToLower();
            if (title.Contains("autocad")) {
                acadWnd = hWnd;
                return false;
            }
            return true;
        }, IntPtr.Zero);

        if (acadWnd == IntPtr.Zero) return false;

        // Bring AutoCAD to foreground briefly
        ShowWindow(acadWnd, 9); // SW_RESTORE
        SetForegroundWindow(acadWnd);
        Thread.Sleep(200);

        // Send ESC ESC to cancel any pending command, then dispatch
        SendKeys.SendWait("{ESC}");
        Thread.Sleep(50);
        SendKeys.SendWait("{ESC}");
        Thread.Sleep(100);
        SendKeys.SendWait("(c:yqmcp-dispatch){ENTER}");
        Thread.Sleep(100);

        return true;
    }
}
"@ -ReferencedAssemblies System.Windows.Forms

[AcadPoke]::Send()
