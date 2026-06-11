namespace DesktopPet;

partial class Form1
{
    private System.ComponentModel.IContainer components = null;

    protected override void Dispose(bool disposing)
    {
        if (disposing && (components != null))
            components.Dispose();
        base.Dispose(disposing);
    }

    private void InitializeComponent()
    {
        this.components = new System.ComponentModel.Container();
        this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
        this.ClientSize = new System.Drawing.Size(1, 1);
        this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
        this.WindowState = System.Windows.Forms.FormWindowState.Minimized;
        this.ShowInTaskbar = false;
        this.Name = "Form1";
        this.Text = "桌宠";
    }
}
