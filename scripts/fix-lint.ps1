$enc = New-Object System.Text.UTF8Encoding($false)

function Edit-File([string]$rel, [scriptblock]$transform) {
  $f = (Resolve-Path -LiteralPath $rel).Path
  $c = [IO.File]::ReadAllText($f)
  $c = & $transform $c
  [IO.File]::WriteAllText($f, $c, $enc)
  Write-Host "patched $rel"
}

$apos = [char]39

Edit-File 'src/app/app/campaigns/[id]/page.tsx' {
  param($c)
  $c.Replace("each day" + $apos + "s content production", "each day&apos;s content production")
}

Edit-File 'src/app/app/scripts/[id]/page.tsx' {
  param($c)
  $c = $c.Replace('Hook: "{variant.hook}"', 'Hook: &quot;{variant.hook}&quot;')
  $c.Replace('"{shot.spokenText}"', '&quot;{shot.spokenText}&quot;')
}
