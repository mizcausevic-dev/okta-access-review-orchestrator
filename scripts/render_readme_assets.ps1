$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$screenshots = Join-Path $root "screenshots"
New-Item -ItemType Directory -Force -Path $screenshots | Out-Null

Add-Type -AssemblyName System.Drawing

function New-ProofImage {
    param(
        [string]$Path,
        [string]$Title,
        [string]$Subtitle,
        [string[]]$Bullets
    )

    $bitmap = New-Object System.Drawing.Bitmap 1600, 1000
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::FromArgb(7, 10, 15))

    $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(11, 18, 32))
    $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 255, 139))
    $altAccentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(25, 199, 255))
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(233, 243, 255))
    $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(171, 186, 201))
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(42, 111, 88), 2)

    $graphics.FillRectangle($panelBrush, 48, 48, 1504, 904)
    $graphics.DrawRectangle($borderPen, 48, 48, 1504, 904)

    $eyebrowFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $titleFont = New-Object System.Drawing.Font("Georgia", 34, [System.Drawing.FontStyle]::Bold)
    $bodyFont = New-Object System.Drawing.Font("Segoe UI", 18)
    $bulletFont = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)

    $graphics.DrawString("Okta Access Review Orchestrator", $eyebrowFont, $accentBrush, 92, 92)
    $graphics.DrawString($Title, $titleFont, $textBrush, 92, 142)
    $graphics.DrawString($Subtitle, $bodyFont, $mutedBrush, 92, 214)

    $y = 320
    foreach ($bullet in $Bullets) {
        $graphics.DrawString("•", $bulletFont, $altAccentBrush, 108, $y)
        $graphics.DrawString($bullet, $bodyFont, $textBrush, 138, $y + 2)
        $y += 82
    }

    $graphics.DrawString("Synthetic proof render for README packaging.", $bodyFont, $mutedBrush, 92, 880)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

New-ProofImage -Path (Join-Path $screenshots "01-overview-proof.png") `
    -Title "Overview proof" `
    -Subtitle "Privileged-role reviews, stale decisions, and remediation posture in one Okta operator surface." `
    -Bullets @(
        "Pending privileged decisions stay visible before audit closeout breaks.",
        "Auto-approvals and self-reviews surface as operator-grade findings.",
        "Identity governance work stays tied to a real remediation packet."
    )

New-ProofImage -Path (Join-Path $screenshots "02-review-lane-proof.png") `
    -Title "Review lane" `
    -Subtitle "Each access review shows owner, scope, close date, and open privileged exposure." `
    -Bullets @(
        "Review ownership stays visible.",
        "Open and privileged decisions are separated cleanly.",
        "Next actions remain audit-safe and operator-readable."
    )

New-ProofImage -Path (Join-Path $screenshots "03-access-risks-proof.png") `
    -Title "Access risks" `
    -Subtitle "Findings map risky principals, resources, and the exact rule that fired." `
    -Bullets @(
        "High severity findings surface first.",
        "Principals and resources remain readable for responders.",
        "The lane is grounded in real-world identity review exports."
    )

New-ProofImage -Path (Join-Path $screenshots "04-remediation-posture-proof.png") `
    -Title "Remediation posture" `
    -Subtitle "Packets tie completeness, blocker, owner, and closeout window together." `
    -Bullets @(
        "Privileged review packets show go/no-go posture.",
        "Guest and app-grant cleanup remains visible.",
        "Green packets still preserve evidence expectations."
    )
