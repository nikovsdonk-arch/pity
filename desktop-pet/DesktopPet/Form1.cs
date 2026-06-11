using System.Net;
using System.Text;
using System.Diagnostics;

namespace DesktopPet;

public partial class Form1 : Form
{
    private HttpListener? _server;
    private int _port;
    private string _wwwRoot;
    private Process? _edgeProcess;
    private NotifyIcon? _trayIcon;

    public Form1()
    {
        _wwwRoot = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
        if (!Directory.Exists(_wwwRoot))
            _wwwRoot = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "wwwroot");

        this.WindowState = FormWindowState.Minimized;
        this.ShowInTaskbar = false;
        this.Load += OnLoad;
        this.FormClosing += OnClosing;
    }

    private async void OnLoad(object? sender, EventArgs e)
    {
        StartServer();
        await Task.Delay(200);
        LaunchEdge();
    }

    private void StartServer()
    {
        _server = new HttpListener();
        var rng = new Random();
        for (int i = 0; i < 100; i++)
        {
            _port = rng.Next(15000, 60000);
            try
            {
                _server.Prefixes.Clear();
                _server.Prefixes.Add($"http://localhost:{_port}/");
                _server.Start();
                break;
            }
            catch { }
        }
        _server.BeginGetContext(HandleRequest, null);
    }

    private void HandleRequest(IAsyncResult ar)
    {
        if (_server == null || !_server.IsListening) return;
        try
        {
            var ctx = _server.EndGetContext(ar);
            _server.BeginGetContext(HandleRequest, null);
            Serve(ctx);
        }
        catch { }
    }

    private void Serve(HttpListenerContext ctx)
    {
        try
        {
            var path = ctx.Request.Url!.AbsolutePath.TrimStart('/');
            if (string.IsNullOrEmpty(path)) path = "index.html";
            var filePath = Path.Combine(_wwwRoot, path);
            if (!File.Exists(filePath)) { ctx.Response.StatusCode = 404; ctx.Response.Close(); return; }

            var ext = Path.GetExtension(filePath).ToLower();
            var mime = ext switch
            {
                ".html" => "text/html; charset=utf-8",
                ".js" => "application/javascript; charset=utf-8",
                ".css" => "text/css; charset=utf-8",
                ".png" => "image/png",
                ".json" => "application/json",
                ".moc3" => "application/octet-stream",
                ".motion3.json" => "application/json",
                _ => "application/octet-stream",
            };

            var bytes = File.ReadAllBytes(filePath);
            ctx.Response.ContentType = mime;
            ctx.Response.ContentLength64 = bytes.Length;
            ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
            ctx.Response.Close();
        }
        catch { }
    }

    private void LaunchEdge()
    {
        var url = $"http://localhost:{_port}/index.html";
        var edgePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
            "Microsoft", "Edge", "Application", "msedge.exe");
        if (!File.Exists(edgePath))
            edgePath = "msedge";

        try
        {
            _edgeProcess = new Process();
            _edgeProcess.StartInfo.FileName = edgePath;
            _edgeProcess.StartInfo.Arguments = $"--app=\"{url}\" --no-first-run --no-default-browser-check";
            _edgeProcess.StartInfo.UseShellExecute = false;
            _edgeProcess.EnableRaisingEvents = true;
            _edgeProcess.Exited += (s, a) =>
            {
                try { Invoke(() => Close()); } catch { }
            };
            _edgeProcess.Start();
        }
        catch (Exception ex)
        {
            MessageBox.Show($"启动失败: {ex.Message}", "错误");
            Close();
        }
    }

    private void OnClosing(object? sender, FormClosingEventArgs e)
    {
        try { _server?.Stop(); _server?.Close(); } catch { }
        try { if (_edgeProcess != null && !_edgeProcess.HasExited) _edgeProcess.Kill(); } catch { }
    }
}
