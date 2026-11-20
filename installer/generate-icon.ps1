Add-Type -AssemblyName System.Drawing
$buildDir = Join-Path $PSScriptRoot '..\build'
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
$bitmap = [System.Drawing.Bitmap]::new(256, 256)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(6, 6, 7))
$pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, 10)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawEllipse($pen, 28, 28, 200, 200)
$graphics.DrawLine($pen, 96, 72, 96, 184)
$graphics.DrawLine($pen, 96, 128, 164, 72)
$graphics.DrawLine($pen, 120, 116, 168, 184)
$graphics.FillEllipse([System.Drawing.Brushes]::White, 151, 59, 26, 26)
$graphics.FillEllipse([System.Drawing.Brushes]::White, 155, 171, 26, 26)
$pngPath = Join-Path $buildDir 'icon.png'
$icoPath = Join-Path $buildDir 'icon.ico'
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$stream = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close(); $icon.Dispose(); $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
