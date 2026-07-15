# JUDGE_PLATFORM.md

Staff roles: HEAD_JUDGE, FLOOR_JUDGE, SCOREKEEPER, ORGANIZER, EVENT_MANAGER.

Auth on new routes uses Identity `PermissionService.can(..., "store.events.*")`.  
No hardcoded `if role == owner` in platform services.
