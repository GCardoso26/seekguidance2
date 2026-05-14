{{- define "tcg-judge-api.name" -}}
tcg-judge-api
{{- end }}

{{- define "tcg-judge-api.fullname" -}}
{{ include "tcg-judge-api.name" . }}
{{- end }}
