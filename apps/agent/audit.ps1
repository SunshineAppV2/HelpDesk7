<#
.SYNOPSIS
    Audit Script for HelpDesk7 Agent
.DESCRIPTION
    Collects Hardware and Software information and sends to HelpDesk7 API.
    Designed to run as a Scheduled Task (Daily).
.PARAMETER Url
    The API Endpoint URL (e.g., https://api.helpdesk7.com/v1/audit)
.PARAMETER ApiKey
    The Organization API Key
#>

param (
    [string]$Url = "http://localhost:3000/api/agent/audit",
    [string]$ApiKey = "TEST-API-KEY",
    [string]$OrgId = "TEST-ORG"
)

# 1. Collect System Info
$computerSystem = Get-CimInstance CIM_ComputerSystem
$operatingSystem = Get-CimInstance CIM_OperatingSystem
$bios = Get-CimInstance CIM_BIOSElement

$hostName = $computerSystem.Name
$model = $computerSystem.Model
$manufacturer = $computerSystem.Manufacturer
$osName = $operatingSystem.Caption
$serialNumber = $bios.SerialNumber

# 2. Collect Installed Software (Registry Approach for performance and coverage)
function Get-InstalledSoftware {
    $paths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    
    $softwareList = @()
    
    foreach ($path in $paths) {
        $keys = Get-ItemProperty $path -ErrorAction SilentlyContinue
        foreach ($key in $keys) {
            if ($null -ne $key.DisplayName -and $key.DisplayName -ne "") {
                $softwareList += @{
                    Name = $key.DisplayName
                    Version = $key.DisplayVersion
                    Publisher = $key.Publisher
                }
            }
        }
    }
    return $softwareList
}

$softwareArgs = Get-InstalledSoftware

# 3. Construct Payload
$payload = @{
    data = @{
        hostname = $hostName
        model = $model
        manufacturer = $manufacturer
        os = $osName
        serialNumber = $serialNumber
        softwares = $softwareArgs
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
}

$jsonPayload = $payload | ConvertTo-Json -Depth 5

# 4. Send to API
try {
    $headers = @{
        "x-api-key" = $ApiKey
        "x-org-id" = $OrgId
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri $Url -Method Post -Body $jsonPayload -Headers $headers -ErrorAction Stop
    Write-Host "Success: $($response.status)"
}
catch {
    Write-Error "Failed to send audit data: $_"
    exit 1
}
