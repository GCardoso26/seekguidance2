param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
& node (Join-Path $here "validate-content.mjs") @Rest
exit $LASTEXITCODE
