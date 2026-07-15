param(
    [string]$Base = "HEAD",
    [switch]$DryRun,
    [string]$SassPackage = "sass@1.69.5"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (& git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

function Normalize-PathForGit {
    param([string]$Path)
    return $Path.Replace("\", "/")
}

function Get-ChangedScssFiles {
    $tracked = @(& git diff --name-only --diff-filter=ACMRT $Base -- "*.scss")
    $untracked = @(& git ls-files --others --exclude-standard -- "*.scss")

    return @($tracked + $untracked) |
        Where-Object { $_ -and $_.Trim() -ne "" } |
        ForEach-Object { Normalize-PathForGit $_ } |
        Sort-Object -Unique
}

function Get-CompileTargets {
    param([string]$ScssPath)

    $fullPath = Join-Path $repoRoot $ScssPath
    $fileName = Split-Path $fullPath -Leaf
    $dir = Split-Path $fullPath -Parent

    if ($fileName.StartsWith("_")) {
        return @(Get-ChildItem -LiteralPath $dir -Filter "*.scss" -File |
            Where-Object { -not $_.Name.StartsWith("_") } |
            ForEach-Object {
                Normalize-PathForGit ([System.IO.Path]::GetRelativePath($repoRoot, $_.FullName))
            })
    }

    return @($ScssPath)
}

function Test-CssHasSourceMapComment {
    param([string]$CssPath)

    if (-not (Test-Path -LiteralPath $CssPath)) {
        return $false
    }

    return [bool](Select-String -LiteralPath $CssPath -Pattern "sourceMappingURL=" -SimpleMatch -Quiet)
}

$changedScss = @(Get-ChangedScssFiles)

if ($changedScss.Count -eq 0) {
    Write-Host "No changed SCSS files found."
    exit 0
}

$targets = @($changedScss | ForEach-Object { Get-CompileTargets $_ }) |
    Sort-Object -Unique

foreach ($target in $targets) {
    $sourcePath = Join-Path $repoRoot $target
    $cssPath = [System.IO.Path]::ChangeExtension($sourcePath, ".css")
    $mapPath = "$cssPath.map"
    $mapExisted = Test-Path -LiteralPath $mapPath
    $useSourceMap = $mapExisted -or (Test-CssHasSourceMapComment $cssPath)

    $displaySource = Normalize-PathForGit ([System.IO.Path]::GetRelativePath($repoRoot, $sourcePath))
    $displayCss = Normalize-PathForGit ([System.IO.Path]::GetRelativePath($repoRoot, $cssPath))
    $sourceMapOption = if ($useSourceMap) { "--source-map" } else { "--no-source-map" }

    Write-Host "Compiling $displaySource -> $displayCss $sourceMapOption"

    if ($DryRun) {
        continue
    }

    $sassArgs = @(
        $SassPackage,
        "--style=expanded",
        $sourceMapOption,
        $sourcePath,
        $cssPath
    )

    & npx @sassArgs

    if ($useSourceMap -and -not $mapExisted -and (Test-Path -LiteralPath $mapPath)) {
        Remove-Item -LiteralPath $mapPath -Force
    }
}
