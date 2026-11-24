# Tiny static file server for previewing the site locally (no Node needed).
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 5500]
param([int]$Port = 5500)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$types = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8'
  '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.svg'='image/svg+xml'; '.webp'='image/webp'
  '.pdf'='application/pdf'; '.xml'='application/xml'; '.txt'='text/plain; charset=utf-8'; '.json'='application/json'
  '.mp4'='video/mp4'; '.webm'='video/webm'
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($path -eq '') { $path = 'index.html' }
    $file = Join-Path $root $path
    if ((Test-Path $file -PathType Container)) { $file = Join-Path $file 'index.html' }
    if (-not (Test-Path $file -PathType Leaf) -and (Test-Path "$file.html" -PathType Leaf)) { $file = "$file.html" }
    $full = [IO.Path]::GetFullPath($file)
    if (-not $full.StartsWith($root) -or -not (Test-Path $full -PathType Leaf)) {
      $ctx.Response.StatusCode = 404; $full = Join-Path $root '404.html'
    }
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
    $ctx.Response.AddHeader('Accept-Ranges', 'bytes')
    # Byte ranges let the browser seek inside videos (needed for the scroll-tied hero).
    $fs = [IO.File]::OpenRead($full)
    try {
      $len = $fs.Length; $from = 0; $to = $len - 1
      $range = $ctx.Request.Headers['Range']
      if ($ctx.Response.StatusCode -eq 200 -and $range -match '^bytes=(\d*)-(\d*)$') {
        if ($matches[1] -ne '') { $from = [int64]$matches[1]; if ($matches[2] -ne '') { $to = [Math]::Min([int64]$matches[2], $len - 1) } }
        elseif ($matches[2] -ne '') { $from = [Math]::Max(0, $len - [int64]$matches[2]) }
        if ($from -gt $to) { $ctx.Response.StatusCode = 416; $ctx.Response.AddHeader('Content-Range', "bytes */$len"); $from = 0; $to = -1 }
        else { $ctx.Response.StatusCode = 206; $ctx.Response.AddHeader('Content-Range', "bytes $from-$to/$len") }
      }
      $count = $to - $from + 1
      $ctx.Response.ContentLength64 = $count
      if ($ctx.Request.HttpMethod -ne 'HEAD') {
        $fs.Position = $from; $buf = New-Object byte[] 65536
        while ($count -gt 0) {
          $n = $fs.Read($buf, 0, [int][Math]::Min($buf.Length, $count)); if ($n -le 0) { break }
          $ctx.Response.OutputStream.Write($buf, 0, $n); $count -= $n
        }
      }
    } finally { $fs.Dispose() }
  } catch { try { $ctx.Response.StatusCode = 500 } catch {} } finally { try { $ctx.Response.Close() } catch {} }
}
